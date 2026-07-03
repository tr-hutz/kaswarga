import {

    ROLES,
    PERMISSIONS

} from './permission-constants'

/*
 |-------------------------------------------------------------
 | MATRIX
 |-------------------------------------------------------------
 */

const ROLE_PERMISSIONS = {

    [ROLES.SUPER_ADMIN]: [

        PERMISSIONS.MANAGE_RT,
        PERMISSIONS.MANAGE_USERS,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.KETUA]: [

        PERMISSIONS.EDIT_RT_PROFILE,

        PERMISSIONS.VIEW_WARGA,
        PERMISSIONS.MANAGE_WARGA,

        PERMISSIONS.VIEW_PEMBAYARAN,

        PERMISSIONS.VIEW_LEDGER,
        PERMISSIONS.VIEW_REPORTING,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.ADMIN]: [

        PERMISSIONS.EDIT_RT_PROFILE,

        PERMISSIONS.VIEW_WARGA,
        PERMISSIONS.MANAGE_WARGA,

        PERMISSIONS.VIEW_PEMBAYARAN,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.BENDAHARA]: [

        PERMISSIONS.EDIT_RT_PROFILE,

        PERMISSIONS.VIEW_WARGA,

        PERMISSIONS.VIEW_PEMBAYARAN,
        PERMISSIONS.APPROVE_PEMBAYARAN,

        PERMISSIONS.VIEW_PENGELUARAN,
        PERMISSIONS.MANAGE_PENGELUARAN,

        PERMISSIONS.VIEW_LEDGER,
        PERMISSIONS.VIEW_REPORTING,

        PERMISSIONS.VIEW_ACTIVITY,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ],

    [ROLES.WARGA]: [

        PERMISSIONS.VIEW_PEMBAYARAN,
        PERMISSIONS.VIEW_NOTIFICATIONS

    ]
}

/*
 |-------------------------------------------------------------
 | CHECK
 |-------------------------------------------------------------
 */

export function hasPermission(

    role,
    permission

) {

    if (!role) {

        return false
    }

    const permissions =

        ROLE_PERMISSIONS[role] || []

    return permissions.includes(
        permission
    )
}