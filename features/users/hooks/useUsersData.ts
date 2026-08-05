'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllUsers } from '@/lib/services/users.service'
import type { PageResult, QueryOptions } from '@/lib/types/query'
import type { UserRow } from '../components/UserColumns'

export function useUsersData(query: QueryOptions) {

    const [allRows, setAllRows] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(false)

    const load = useCallback(async () => {

        setLoading(true)
        setError(false)

        try {
            const users = await getAllUsers()

            const rows: UserRow[] = users.flatMap((user): UserRow[] => {
                const memberships = user.memberships || []

                if (!memberships.length) {
                    return [{
                        _userId:      user.id,
                        name:         user.name || '-',
                        email:        user.email || '-',
                        rtName:       null,
                        role:         '',
                        membershipId: '',
                        _user:        user,
                        _membership:  null,
                    }]
                }

                return memberships.map(m => ({
                    _userId:      user.id,
                    name:         user.name || '-',
                    email:        user.email || '-',
                    rtName:       m.rt?.name ?? null,
                    role:         m.role,
                    membershipId: m.id,
                    _user:        user,
                    _membership:  m,
                }))
            })

            setAllRows(rows)

        } catch (err) {
            console.error('[useUsersData]', err)
            setError(true)
        } finally {
            setLoading(false)
        }

    }, [])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load() }, [load])

    const result = useMemo<PageResult<UserRow> | null>(() => {
        if (loading || error) return null
        const { page, pageSize } = query
        const total      = allRows.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const safePage   = Math.min(Math.max(1, page), totalPages)
        const start      = (safePage - 1) * pageSize
        return {
            data: allRows.slice(start, start + pageSize),
            total,
            page:       safePage,
            pageSize,
            totalPages,
        }
    }, [allRows, query, loading, error])

    return { result, loading, error, refresh: load }
}
