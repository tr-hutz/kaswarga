'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { findResidentsPaginated } from '@/lib/repositories/resident.repository'
import { useAuth } from '@/lib/auth/useAuth'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { Database } from '@/types/database'

type ResidentRow = Database['public']['Tables']['residents']['Row']

export function useResidentData(query: QueryOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined

    const [result,  setResult]  = useState<PageResult<ResidentRow> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    // Serialize query to stable key so the effect fires only when values change
    const queryKey = JSON.stringify({ query })

    async function load() {
        if (!rtId) return
        setLoading(true)
        setError(false)
        try {
            const page = await findResidentsPaginated(rtId, query)
            setResult(page)
        } catch (err) {
            console.error('[WARGA]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [rtId, queryKey])

    return { result, loading, error, reload: load }
}
