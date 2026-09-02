'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { useAuth }              from '@/lib/auth/useAuth'
import { findIncomesPaginated } from '@/lib/repositories/income.repository'
import { mapIncome }            from '@/features/income/services/income-transform'
import type { QueryOptions, PageResult } from '@/lib/types/query'

export type MappedIncome = ReturnType<typeof mapIncome>[number]

export function useIncomeData(query: QueryOptions) {
    const { membership } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined

    const [result,  setResult]  = useState<PageResult<MappedIncome> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify(query)

    async function load() {
        if (!rtId) return
        setLoading(true)
        setError(false)
        try {
            const raw  = await findIncomesPaginated(rtId, query)
            const data = mapIncome(raw.data)
            setResult({ ...raw, data })
        } catch (err) {
            console.error('[INCOME]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [rtId, queryKey])

    return { result, loading, error, reload: load }
}
