import {

    ROLES,
    PERMISSIONS

} from './permission-constants'

/*
 |-------------------------------------------------------------
 | MATRIX
 |-------------------------------------------------------------
 */

const ROLE_PERMISSIONS: Record<string, string[]> = {

    [ROLES.SUPER_ADMIN]: [

        PERMISSIONS.MANAGE_RT,
        PERMISSIONS.MANAGE_USERS,

        PERMISSIONS.MANAGE_ROLES,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.CHAIR]: [

        PERMISSIONS.EDIT_RT_PROFILE,

        PERMISSIONS.VIEW_RESIDENTS,
        PERMISSIONS.MANAGE_RESIDENTS,

        PERMISSIONS.VIEW_PAYMENTS,

        PERMISSIONS.VIEW_EXPENSES,
        PERMISSIONS.APPROVE_EXPENSES,

        PERMISSIONS.VIEW_LEDGER,
        PERMISSIONS.VIEW_REPORTING,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.ADMIN]: [

        PERMISSIONS.EDIT_RT_PROFILE,

        PERMISSIONS.VIEW_RESIDENTS,
        PERMISSIONS.MANAGE_RESIDENTS,

        PERMISSIONS.VIEW_PAYMENTS,

        PERMISSIONS.VIEW_EXPENSES,

        PERMISSIONS.VIEW_LEDGER,

        PERMISSIONS.MANAGE_ROLES,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.TREASURER]: [

        PERMISSIONS.EDIT_RT_PROFILE,

        PERMISSIONS.VIEW_RESIDENTS,

        PERMISSIONS.VIEW_PAYMENTS,
        PERMISSIONS.APPROVE_PAYMENTS,

        PERMISSIONS.VIEW_EXPENSES,
        PERMISSIONS.MANAGE_EXPENSES,

        PERMISSIONS.VIEW_LEDGER,
        PERMISSIONS.VIEW_REPORTING,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.RESIDENT]: [

        PERMISSIONS.VIEW_RESIDENTS,

        PERMISSIONS.VIEW_PAYMENTS,

        PERMISSIONS.VIEW_EXPENSES,

        PERMISSIONS.VIEW_LEDGER,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ]
}

/*
 |-------------------------------------------------------------
 | CHECK
 |-------------------------------------------------------------
 */

export function hasPermission(
    role: string | null | undefined,
    permission: string
): boolean {
    if (!role) return false
    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.includes(permission)
}
