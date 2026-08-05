'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllRt }                          from '@/lib/services/rt.service'
import type { PageResult, QueryOptions }    from '@/lib/types/query'

export function useRtData(query: QueryOptions) {

    const [allData, setAllData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const rows = await getAllRt()
            setAllData(rows)
        } catch (err) {
            console.error('[useRtData]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load() }, [load])

    const result = useMemo<PageResult<any> | null>(() => {
        if (loading || error) return null
        const { page, pageSize } = query
        const total      = allData.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const safePage   = Math.min(Math.max(1, page), totalPages)
        const start      = (safePage - 1) * pageSize
        return {
            data: allData.slice(start, start + pageSize),
            total,
            page:       safePage,
            pageSize,
            totalPages,
        }
    }, [allData, query, loading, error])

    return { result, loading, error, refresh: load }
}
