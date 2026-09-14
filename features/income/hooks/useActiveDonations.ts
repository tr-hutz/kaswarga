'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'

export function useActiveDonations() {
    const [donations, setDonations] = useState<any[]>([])
    const [loading,   setLoading]   = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res  = await fetch('/api/income/donations/active')
            const data = await res.json()
            setDonations(Array.isArray(data) ? data : [])
        } catch {
            setDonations([])
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    useEffect(() => { load() }, [])

    return { donations, loading, reload: load }
}
