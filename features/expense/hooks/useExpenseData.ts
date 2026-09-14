'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { findExpensesPaginated } from '@/lib/repositories/expense.repository'
import { mapExpense } from '@/lib/mappers/expense.mapper'
import type { QueryOptions, PageResult } from '@/lib/types/query'

export type MappedExpense = ReturnType<typeof mapExpense>[number]

export function useExpenseData(query: QueryOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = useAuth()
    const rtId = membership?.rt?.id as string | undefined

    const [result,  setResult]  = useState<PageResult<MappedExpense> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify(query)

    async function load() {
        if (!rtId) return
        setLoading(true)
        setError(false)
        try {
            const raw  = await findExpensesPaginated(rtId, query)
            const data = mapExpense(raw.data)
            setResult({ ...raw, data })
        } catch (err) {
            console.error('[PENGELUARAN]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [rtId, queryKey])

    return { result, loading, error, reload: load }
}
