'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { findActivitiesPaginated, findActivityStats } from '@/lib/repositories/activity.repository'
import { transformActivity } from '../services/activity-transform'
import type { QueryOptions, PageResult } from '@/lib/types/query'

export type MappedActivity = ReturnType<typeof transformActivity>[number]

export interface ActivityStats {
    total:              number
    paymentApprovals:   number
    paymentRejections:  number
    expenseApprovals:   number
    expenseRejections:  number
    residentCount:      number
}

export function useActivityData(query: QueryOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined

    const [result,  setResult]  = useState<PageResult<MappedActivity> | null>(null)
    const [stats,   setStats]   = useState<ActivityStats>({ total: 0, paymentApprovals: 0, paymentRejections: 0, expenseApprovals: 0, expenseRejections: 0, residentCount: 0 })
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(false)

    const queryKey = JSON.stringify(query)

    async function load() {
        if (!rtId) return
        setLoading(true)
        setError(false)
        try {
            const [raw, rawStats] = await Promise.all([
                findActivitiesPaginated(rtId, query),
                findActivityStats(rtId),
            ])
            const data = transformActivity(raw.data)
            setResult({ ...raw, data })
            setStats(rawStats)
        } catch (err) {
            console.error('[ACTIVITY]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [rtId, queryKey])

    return { result, stats, loading, error, reload: load }
}
