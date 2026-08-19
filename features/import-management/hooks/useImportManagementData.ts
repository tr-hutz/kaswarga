'use client'

import { useState, useEffect } from 'react'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { ImportJob } from '@/lib/import/types'

export function useImportManagementData(query: QueryOptions) {
    const [result,  setResult]  = useState<PageResult<ImportJob> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify(query)

    async function load() {
        setLoading(true)
        setError(false)
        try {
            const params = new URLSearchParams()
            params.set('page',     String(query.page))
            params.set('pageSize', String(query.pageSize))
            if (query.search) params.set('search', query.search)
            const status = query.filters?.status
            if (status && status !== 'all') params.set('status', String(status))
            const importType = query.filters?.import_type
            if (importType && importType !== 'all') params.set('type', String(importType))
            const res = await fetch(`/api/import?${params}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            setResult(await res.json())
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [queryKey])

    return { result, loading, error, reload: load }
}
