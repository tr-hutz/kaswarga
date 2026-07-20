'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { findConfirmationsPaginated } from '@/lib/repositories/payment.repository'
import { mapConfirmation } from '@/lib/mappers/payment.mapper'
import type { QueryOptions, PageResult } from '@/lib/types/query'

export type ConfirmationRow = ReturnType<typeof mapConfirmation>[number]

export function usePaymentData(query: QueryOptions, year = new Date().getFullYear()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined

    const [result,  setResult]  = useState<PageResult<ConfirmationRow> | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify({ query, year })

    async function load() {
        if (!rtId) return
        setLoading(true)
        setError(false)
        try {
            const raw  = await findConfirmationsPaginated(rtId, query, year)
            const data = mapConfirmation(raw.data)
            setResult({ ...raw, data })
        } catch (err) {
            console.error('[PAYMENTS]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [rtId, queryKey])

    return { result, loading, error, reload: load }
}
