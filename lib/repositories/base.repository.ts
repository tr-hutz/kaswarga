import { supabase } from '../supabase'
import type { QueryOptions, PageResult } from '../types/query'

export interface RepositoryConfig {
    table: string
    select?: string
    searchColumns?: string[]
    defaultSortBy?: string
    defaultSortDirection?: 'asc' | 'desc'
}

export function createRepository<T>(config: RepositoryConfig) {
    const {
        table,
        select = '*',
        searchColumns = [],
        defaultSortBy,
        defaultSortDirection = 'asc',
    } = config

    return {
        async findAll(query: QueryOptions): Promise<PageResult<T>> {
            const from = (query.page - 1) * query.pageSize
            const to   = from + query.pageSize - 1

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let q = (supabase as any).from(table).select(select, { count: 'exact' })

            // Full-text search across configured columns
            const term = query.search?.trim()
            if (term && searchColumns.length > 0) {
                q = q.or(searchColumns.map(col => `${col}.ilike.%${term}%`).join(','))
            }

            // User-facing filters — skip null / undefined / 'all'
            if (query.filters) {
                for (const [key, value] of Object.entries(query.filters)) {
                    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                        q = q.eq(key, value)
                    }
                }
            }

            // Sort — falls back to defaultSortBy if no query sort
            const sortBy  = query.sortBy ?? defaultSortBy
            const sortAsc = (query.sortDirection ?? defaultSortDirection) === 'asc'
            if (sortBy) {
                q = q.order(sortBy, { ascending: sortAsc })
            }

            q = q.range(from, to)

            const { data, error, count } = await q
            if (error) throw error

            const total = count ?? 0
            return {
                data:       (data ?? []) as T[],
                total,
                page:       query.page,
                pageSize:   query.pageSize,
                totalPages: Math.ceil(total / query.pageSize),
            }
        },
    }
}
