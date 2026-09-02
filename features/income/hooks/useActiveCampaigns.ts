'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'

export function useActiveCampaigns() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading,   setLoading]   = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res  = await fetch('/api/income/campaigns/active')
            const data = await res.json()
            setCampaigns(Array.isArray(data) ? data : [])
        } catch {
            setCampaigns([])
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [])

    return { campaigns, loading, reload: load }
}
