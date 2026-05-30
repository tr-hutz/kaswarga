'use client'

import {

    useAuth

} from '../auth/useAuth'

export default function RoleGuard({

                                      roles = [],

                                      children,

                                      fallback = null

                                  }) {

    const {

        role

    } = useAuth()

    if (

        !roles.includes(role)
    ) {

        return fallback
    }

    return children
}