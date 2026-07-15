'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { QueryOptions } from '@/lib/types/query'
import { DEFAULT_PAGE_SIZE } from '@/lib/types/query'

export interface UseDataTableReturn {
    query: QueryOptions
    setPage:   (page: number) => void
    setSearch: (search: string) => void
    setSort:   (sortBy: string, direction: 'asc' | 'desc') => void
    setFilter: (key: string, value: unknown) => void
    reset:     () => void
}

/**
 * Manages DataTable query state in the URL so that pagination, search,
 * sort, and filters survive page refresh and are sharable.
 *
 * Filter params are prefixed with "f_" to avoid collisions with route params.
 * e.g. active=true is stored as ?f_active=true
 */
export function useDataTable(defaults?: Partial<QueryOptions>): UseDataTableReturn {
    const router       = useRouter()
    const pathname     = usePathname()
    const searchParams = useSearchParams()

    const page      = Number(searchParams.get('page')      ?? defaults?.page      ?? 1)
    const pageSize  = Number(searchParams.get('pageSize')  ?? defaults?.pageSize  ?? DEFAULT_PAGE_SIZE)
    const search    = searchParams.get('search')           ?? defaults?.search    ?? undefined
    const sortBy    = searchParams.get('sortBy')           ?? defaults?.sortBy    ?? undefined
    const sortDirection =
        (searchParams.get('sortDirection') as 'asc' | 'desc' | null)
        ?? defaults?.sortDirection
        ?? 'asc'

    // Collect all f_* params as filters
    const filters: Record<string, unknown> = {}
    searchParams.forEach((value, key) => {
        if (key.startsWith('f_')) filters[key.slice(2)] = value
    })
    if (defaults?.filters) {
        for (const [k, v] of Object.entries(defaults.filters)) {
            if (!(k in filters)) filters[k] = v
        }
    }

    const query: QueryOptions = {
        page,
        pageSize,
        search:    search || undefined,
        sortBy:    sortBy || undefined,
        sortDirection,
        filters:   Object.keys(filters).length > 0 ? filters : undefined,
    }

    const push = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString())
            for (const [key, value] of Object.entries(updates)) {
                if (value === null || value === '') params.delete(key)
                else params.set(key, value)
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false })
        },
        [router, pathname, searchParams],
    )

    const setPage = useCallback(
        (p: number) => push({ page: String(p) }),
        [push],
    )

    const setSearch = useCallback(
        (s: string) => push({ search: s || null, page: '1' }),
        [push],
    )

    const setSort = useCallback(
        (by: string, direction: 'asc' | 'desc') =>
            push({ sortBy: by, sortDirection: direction, page: '1' }),
        [push],
    )

    const setFilter = useCallback(
        (key: string, value: unknown) =>
            push({
                [`f_${key}`]: value != null && value !== 'all' && value !== '' ? String(value) : null,
                page: '1',
            }),
        [push],
    )

    const reset = useCallback(
        () => router.push(pathname, { scroll: false }),
        [router, pathname],
    )

    return { query, setPage, setSearch, setSort, setFilter, reset }
}
