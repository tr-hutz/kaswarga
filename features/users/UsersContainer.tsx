'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo }          from 'react'
import { useTranslations }  from 'next-intl'
import { useUsersData }     from './hooks/useUsersData'
import { useUsersActions }  from './hooks/useUsersActions'
import { useAuth }          from '@/lib/auth/useAuth'
import { buildUserColumns } from './components/UserColumns'
import UsersView            from './UsersView'

export default function UsersContainer() {
    const t  = useTranslations('users')
    const { user } = useAuth()

    const { result, loading, error, refresh } = useUsersData()
    const actions = useUsersActions(refresh)

    const columns = useMemo(
        () => buildUserColumns({
            t:                  k => t(k as any),
            currentUserId:      user?.id,
            onEditRole:         actions.setEditTarget,
            onRemoveMembership: actions.setDelTarget,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user?.id],
    )

    return (
        <UsersView
            result={result}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={refresh}
            {...actions}
        />
    )
}
