'use client'

import {

    usePermission

} from '../permissions/usePermission'

export default function PermissionGuard({

                                            permission,

                                            children,

                                            fallback = null

                                        }) {

    const allowed =

        usePermission(
            permission
        )

    if (!allowed) {

        return fallback
    }

    return children
}