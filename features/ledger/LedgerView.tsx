'use client'

import { useMemo }           from 'react'
import { useTranslations }   from 'next-intl'
import { DataTable }         from '@/components/common/data-table'
import LedgerAnalytics       from './components/analytics/LedgerAnalytics'
import LedgerReport          from './components/LedgerReport'
import LedgerDrawer          from './components/drawer/LedgerDrawer'
import { buildLedgerColumns } from './components/LedgerColumns'
import ExportDropdown from '@/components/ui/ExportDropdown'
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
    setFilter:       (key: string, value: unknown) => void
    selectedRow:     LedgerRow | null
    drawerOpen:      boolean
    openDrawer:      (r: LedgerRow) => void
    closeDrawer:     () => void
    exportExcel:     (rows: LedgerRow[]) => void
}

export default function LedgerView({
    result, totals, loading, error, onRetry,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    selectedRow, drawerOpen, openDrawer, closeDrawer,
    exportExcel,
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
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            </div>

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
                renderFilters={
                    <select
                        value={String(query.filters?.type ?? 'all')}
                        onChange={(e) => setFilter('type', e.target.value)}
                        className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                    >
                        <option value="all">{t('filters.allTypes')}</option>
                        <option value="pemasukan">{t('filters.pemasukan')}</option>
                        <option value="pengeluaran">{t('filters.pengeluaran')}</option>
                    </select>
                }
                renderActions={
                    <ExportDropdown
                        onExportExcel={() => exportExcel(data)}
                    />
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
