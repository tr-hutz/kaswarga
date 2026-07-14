// @ts-nocheck
'use client'

import { useUsersData }    from './hooks/useUsersData'
import { useUsersActions } from './hooks/useUsersActions'
import { useAuth }         from '@/lib/auth/useAuth'
import UsersView           from './UsersView'

export default function UsersContainer() {

    const { data, loading, error, refresh } = useUsersData()
    const { user } = useAuth()

    const actions = useUsersActions(refresh)

    return (
        <UsersView
            data={data}
            loading={loading}
            error={error}
            onRetry={refresh}
            currentUserId={user?.id}
            {...actions}
        />
    )
}
