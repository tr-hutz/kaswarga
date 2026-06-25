'use client'

import { useUsersData }    from './hooks/useUsersData'
import { useUsersActions } from './hooks/useUsersActions'
import UsersView           from './UsersView'

export default function UsersContainer() {

    const { data, loading, refresh } = useUsersData()

    const actions = useUsersActions(refresh)

    return (
        <UsersView
            data={data}
            loading={loading}
            {...actions}
        />
    )
}
