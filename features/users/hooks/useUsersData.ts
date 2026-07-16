// @ts-nocheck
'use client'

import { useCallback, useEffect, useState } from 'react'
import { getAllUsers } from '@/lib/services/users.service'
import type { PageResult } from '@/lib/types/query'
import type { UserRow } from '../components/UserColumns'

export function useUsersData() {

    const [result,  setResult]  = useState<PageResult<UserRow> | null>(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(false)

    const load = useCallback(async () => {

        setLoading(true)
        setError(false)

        try {
            const users = await getAllUsers()

            const rows: UserRow[] = users.flatMap(user => {
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

            setResult({
                data:       rows,
                total:      rows.length,
                page:       1,
                pageSize:   rows.length || 1,
                totalPages: 1,
            })

        } catch (err) {
            console.error('[useUsersData]', err)
            setError(true)
        } finally {
            setLoading(false)
        }

    }, [])

    useEffect(() => { load() }, [load])

    return { result, loading, error, refresh: load }
}
