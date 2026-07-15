'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { QueryOptions } from '@/lib/types/query'
import { DEFAULT_PAGE_SIZE } from '@/lib/types/query'

export interface UseDataTableReturn {
    query:        QueryOptions
    setPage:      (page: number) => void
    setPageSize:  (size: number) => void
    setSearch:    (search: string) => void
    setSort:      (sortBy: string, direction: 'asc' | 'desc') => void
    setFilter:    (key: string, value: unknown) => void
    reset:        () => void
}

const STORAGE_NS = 'dt:pageSize:'

function readStoredPageSize(storageKey: string): number | null {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_NS + storageKey)
    const n = Number(raw)
    return raw && Number.isFinite(n) && n > 0 ? n : null
}

function writeStoredPageSize(storageKey: string, size: number) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_NS + storageKey, String(size))
}

/**
 * Manages DataTable query state in the URL so that pagination, search,
 * sort, and filters survive page refresh and are sharable.
 *
 * Pass a storageKey (e.g. 'residents') to persist the user's chosen page
 * size in localStorage per feature. Priority: URL → localStorage → default.
 *
 * Filter params are prefixed with "f_" to avoid collisions with route params.
 * e.g. active=true → ?f_active=true
 */
export function useDataTable(
    defaults?: Partial<QueryOptions>,
    storageKey?: string,
): UseDataTableReturn {
    const router       = useRouter()
    const pathname     = usePathname()
    const searchParams = useSearchParams()

    // pageSize priority: URL param → localStorage → defaults → built-in default
    const urlPageSize  = searchParams.get('pageSize')
    const storedSize   = storageKey ? readStoredPageSize(storageKey) : null
    const pageSize     = Number(
        urlPageSize ?? storedSize ?? defaults?.pageSize ?? DEFAULT_PAGE_SIZE
    )

    const page     = Number(searchParams.get('page') ?? defaults?.page ?? 1)
    const search   = searchParams.get('search')      ?? defaults?.search    ?? undefined
    const sortBy   = searchParams.get('sortBy')      ?? defaults?.sortBy    ?? undefined
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
        search:         search || undefined,
        sortBy:         sortBy || undefined,
        sortDirection,
        filters:        Object.keys(filters).length > 0 ? filters : undefined,
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

    const setPageSize = useCallback(
        (size: number) => {
            if (storageKey) writeStoredPageSize(storageKey, size)
            push({ pageSize: String(size), page: '1' })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [push, storageKey],
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

    return { query, setPage, setPageSize, setSearch, setSort, setFilter, reset }
}
