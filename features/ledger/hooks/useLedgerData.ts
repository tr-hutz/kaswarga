'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { findLedgerPaginated, findLedgerTotals } from '@/lib/repositories/ledger.repository'
import { transformLedger } from '@/features/ledger/services/ledger-transform'
import type { QueryOptions, PageResult } from '@/lib/types/query'

export type LedgerRow = ReturnType<typeof transformLedger>[number]

export interface LedgerTotals {
    income:  number
    expense: number
    balance: number
}

export function useLedgerData(query: QueryOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined

    const [result,  setResult]  = useState<PageResult<LedgerRow> | null>(null)
    const [totals,  setTotals]  = useState<LedgerTotals>({ income: 0, expense: 0, balance: 0 })
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify(query)

    async function load() {
        if (!rtId) return
        setLoading(true)
        setError(false)
        try {
            const [raw, rawTotals] = await Promise.all([
                findLedgerPaginated(rtId, query),
                findLedgerTotals(rtId),
            ])
            const data = transformLedger(raw.data)
            setResult({ ...raw, data })
            setTotals({ ...rawTotals, balance: rawTotals.income - rawTotals.expense })
        } catch (err) {
            console.error('[LEDGER]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [rtId, queryKey])

    return { result, totals, loading, error, reload: load }
}
