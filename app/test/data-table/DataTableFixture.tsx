'use client'

import { useMemo }         from 'react'
import { useSearchParams } from 'next/navigation'
import { DataTable }       from '@/components/common/data-table'
import { useDataTable }    from '@/lib/hooks/useDataTable'
import type { Column, QueryOptions, PageResult } from '@/lib/types/query'

// ─── Mock dataset ─────────────────────────────────────────────────────────────

type MockRow = { id: string; name: string; group: string; status: 'active' | 'inactive' }

const MOCK: MockRow[] = Array.from({ length: 55 }, (_, i) => ({
    id:     String(i + 1).padStart(3, '0'),
    name:   `Item ${String(i + 1).padStart(3, '0')}`,
    group:  ['A', 'B', 'C', 'D', 'E'][i % 5],
    status: i % 4 === 3 ? 'inactive' : 'active',
}))

// ─── Client-side query engine ─────────────────────────────────────────────────

function applyQuery(data: MockRow[], query: QueryOptions): PageResult<MockRow> {
    let rows = data

    const term = query.search?.toLowerCase().trim()
    if (term) {
        rows = rows.filter(r =>
            r.name.toLowerCase().includes(term) ||
            r.group.toLowerCase().includes(term)
        )
    }

    const status = query.filters?.status as string | undefined
    if (status && status !== 'all' && status !== '') {
        rows = rows.filter(r => r.status === status)
    }

    if (query.sortBy) {
        const key = query.sortBy as keyof MockRow
        const dir = query.sortDirection === 'desc' ? -1 : 1
        rows = [...rows].sort((a, b) =>
            String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir
        )
    }

    const total = rows.length
    const from  = (query.page - 1) * query.pageSize
    return {
        data:       rows.slice(from, from + query.pageSize),
        total,
        page:       query.page,
        pageSize:   query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
    }
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: Column<MockRow>[] = [
    { key: 'id',    title: 'ID' },
    { key: 'name',  title: 'Name',   sortable: true },
    { key: 'group', title: 'Group',  sortable: true },
    {
        key: 'status', title: 'Status', sortable: true,
        render: (row) => (
            <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${row.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }
            `}>
                {row.status}
            </span>
        ),
    },
]

// ─── Exports ──────────────────────────────────────────────────────────────────

function downloadCSV() {
    const header = 'id,name,group,status'
    const rows   = MOCK.map(r => `${r.id},${r.name},${r.group},${r.status}`)
    const blob   = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = Object.assign(document.createElement('a'), { href: url, download: 'data-table-test.csv' })
    a.click()
    URL.revokeObjectURL(url)
}

async function downloadExcel() {
    const ExcelJS  = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Data')
    sheet.addRow(Object.keys(MOCK[0]))
    MOCK.forEach(row => sheet.addRow(Object.values(row)))
    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url    = URL.createObjectURL(blob)
    const a      = Object.assign(document.createElement('a'), { href: url, download: 'data-table-test.xlsx' })
    a.click()
    URL.revokeObjectURL(url)
}

// ─── Fixture component ────────────────────────────────────────────────────────

export default function DataTableFixture() {
    const searchParams = useSearchParams()

    // ?sim=loading or ?sim=error forces those states without a real fetch
    const sim       = searchParams.get('sim')
    const isLoading = sim === 'loading'
    const isError   = sim === 'error'

    const { query, setPage, setPageSize, setSearch, setSort, setFilter } =
        useDataTable({ sortBy: 'name' }, 'dt-fixture')

    const result = useMemo<PageResult<MockRow> | null>(
        () => (isLoading || isError ? null : applyQuery(MOCK, query)),
        // eslint-disable-next-line react-hooks/use-memo
        [isLoading, isError, JSON.stringify(query)],
    )

    return (
        <DataTable
            columns={COLUMNS}
            result={result}
            loading={isLoading}
            error={isError}
            query={query}
            searchPlaceholder="Search items..."
            onSearch={setSearch}
            onSort={setSort}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRetry={() => window.location.reload()}
            renderFilters={
                <select
                    data-testid="dt-status-filter"
                    value={String(query.filters?.status ?? '')}
                    onChange={(e) => setFilter('status', e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            }
            renderActions={
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadExcel}
                        className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
                    >
                        Export CSV
                    </button>
                </div>
            }
        />
    )
}
