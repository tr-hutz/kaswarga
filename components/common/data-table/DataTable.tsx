'use client'

import type { Column, QueryOptions, PageResult } from '@/lib/types/query'
import DataTableToolbar from './DataTableToolbar'
import SortButton       from './SortButton'
import LoadingState     from './LoadingState'
import EmptyState       from './EmptyState'
import ErrorState       from './ErrorState'
import Pagination       from './Pagination'

interface DataTableProps<T> {
    columns:          Column<T>[]
    result:           PageResult<T> | null
    loading?:         boolean
    error?:           boolean
    query?:           QueryOptions
    // toolbar
    searchPlaceholder?: string
    onSearch?:        (search: string) => void
    onSort?:          (sortBy: string, direction: 'asc' | 'desc') => void
    onPageChange?:        (page: number) => void
    onPageSizeChange?:    (size: number) => void
    onRetry?:             () => void
    onRowClick?:      (row: T) => void
    // slots
    renderFilters?:   React.ReactNode
    renderActions?:   React.ReactNode
}

export default function DataTable<T>({
    columns,
    result,
    loading    = false,
    error      = false,
    query,
    searchPlaceholder,
    onSearch,
    onSort,
    onPageChange,
    onPageSizeChange,
    onRetry,
    onRowClick,
    renderFilters,
    renderActions,
}: DataTableProps<T>) {
    const showPagination =
        !loading && !error && result && (onPageChange || onPageSizeChange)

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            {(onSearch || renderFilters || renderActions) && (
                <DataTableToolbar
                    search={query?.search}
                    searchPlaceholder={searchPlaceholder}
                    onSearch={onSearch}
                    renderFilters={renderFilters}
                    renderActions={renderActions}
                />
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stroke bg-body">
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    style={col.width ? { width: col.width } : undefined}
                                    className="px-4 py-3 text-left text-xs font-medium text-dark-5 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {col.sortable && onSort ? (
                                        <SortButton
                                            column={col.key}
                                            currentSortBy={query?.sortBy}
                                            currentDirection={query?.sortDirection}
                                            onSort={onSort}
                                        >
                                            {col.title}
                                        </SortButton>
                                    ) : (
                                        col.title
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-stroke">
                        {loading ? (
                            <LoadingState columns={columns.length} />
                        ) : error ? (
                            <ErrorState onRetry={onRetry} />
                        ) : !result || result.data.length === 0 ? (
                            <EmptyState />
                        ) : (
                            result.data.map((row, i) => (
                                <tr
                                    key={i}
                                    data-testid="dt-row"
                                    onClick={() => onRowClick?.(row)}
                                    className={`
                                        border-t border-stroke transition-colors
                                        ${onRowClick ? 'cursor-pointer hover:bg-body' : ''}
                                    `}
                                >
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-3 text-dark">
                                            {col.render
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                ? col.render(row)
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                : String((row as any)[col.key] ?? '')
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {showPagination && (
                <Pagination
                    page={result!.page}
                    totalPages={result!.totalPages}
                    total={result!.total}
                    pageSize={result!.pageSize}
                    onPageChange={onPageChange ?? (() => {})}
                    onPageSizeChange={onPageSizeChange}
                />
            )}
        </div>
    )
}
