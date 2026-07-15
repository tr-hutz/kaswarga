export interface QueryOptions {
    page: number
    pageSize: number
    search?: string
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
    filters?: Record<string, unknown>
}

export interface PageResult<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export interface Column<T> {
    key: string
    title: string
    sortable?: boolean
    width?: string
    render?: (row: T) => React.ReactNode
}

export const DEFAULT_PAGE_SIZE = 20

export const DEFAULT_QUERY: QueryOptions = {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortDirection: 'asc',
}
