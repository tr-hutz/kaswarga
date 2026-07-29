'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PageResult, QueryOptions }    from '@/lib/types/query'
import type { RoleRow }                     from '@/lib/repositories/role.repository'
import { DEFAULT_PAGE_SIZE }                from '@/lib/types/query'

const DEFAULT_QUERY: QueryOptions = {
    page:          1,
    pageSize:      DEFAULT_PAGE_SIZE,
    search:        '',
    sortBy:        'name',
    sortDirection: 'asc',
}

export function useRolesData() {
    const [result,  setResult]  = useState<PageResult<RoleRow> | null>(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(false)
    const [query,   setQuery]   = useState<QueryOptions>(DEFAULT_QUERY)

    const load = useCallback(async (q: QueryOptions) => {
        setLoading(true)
        setError(false)
        try {
            const params = new URLSearchParams({
                page:          String(q.page),
                pageSize:      String(q.pageSize),
                sortBy:        q.sortBy        ?? 'name',
                sortDirection: q.sortDirection ?? 'asc',
                ...(q.search ? { search: q.search } : {}),
            })
            const res = await fetch(`/api/roles?${params}`)
            if (!res.ok) throw new Error(res.statusText)
            const data = await res.json() as PageResult<RoleRow>
            setResult(data)
        } catch (err) {
            console.error('[useRolesData]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    const refresh = useCallback(() => load(query), [load, query])

    useEffect(() => { load(query) }, [load, query])

    function onSearch(search: string) {
        setQuery(q => ({ ...q, page: 1, search }))
    }

    function onSort(sortBy: string, sortDirection: 'asc' | 'desc') {
        setQuery(q => ({ ...q, page: 1, sortBy, sortDirection }))
    }

    function onPageChange(page: number) {
        setQuery(q => ({ ...q, page }))
    }

    function onPageSizeChange(pageSize: number) {
        setQuery(q => ({ ...q, page: 1, pageSize }))
    }

    return { result, loading, error, query, refresh, onSearch, onSort, onPageChange, onPageSizeChange }
}
