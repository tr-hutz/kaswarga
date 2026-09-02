'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import type { QueryOptions, PageResult } from '@/lib/types/query'

export function useCampaignData(query: QueryOptions) {
    const [result,  setResult]  = useState<PageResult<any> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify(query)

    async function load() {
        setLoading(true)
        setError(false)
        try {
            const params = new URLSearchParams({
                page:     String(query.page),
                pageSize: String(query.pageSize),
                search:   query.search ?? '',
                status:   (query.filters?.status as string) ?? 'all',
            })
            const res  = await fetch(`/api/income/campaigns?${params}`)
            if (!res.ok) throw new Error(`API error ${res.status}`)
            const data = await res.json()
            setResult(data)
        } catch (err) {
            console.error('[CAMPAIGNS]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [queryKey])

    return { result, loading, error, reload: load }
}
