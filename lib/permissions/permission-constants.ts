export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    KETUA:       'ketua',
    ADMIN:       'admin',
    BENDAHARA:   'bendahara',
    WARGA:       'warga'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const PERMISSIONS = {

    /*
     |-------------------------------------------------------------
     | RT MANAGEMENT (super_admin only)
     |-------------------------------------------------------------
     */

    MANAGE_RT:
        'manage_rt',

    /*
     |-------------------------------------------------------------
     | RT PROFILE (ketua / admin / bendahara — own RT only)
     |-------------------------------------------------------------
     */

    EDIT_RT_PROFILE:
        'edit_rt_profile',

    /*
     |-------------------------------------------------------------
     | USER MANAGEMENT (super_admin only)
     |-------------------------------------------------------------
     */

    MANAGE_USERS:
        'manage_users',

    /*
     |-------------------------------------------------------------
     | WARGA
     |-------------------------------------------------------------
     */

    VIEW_WARGA:
        'view_warga',

    MANAGE_WARGA:
        'manage_warga',

    /*
     |-------------------------------------------------------------
     | PEMBAYARAN
     |-------------------------------------------------------------
     */

    VIEW_PEMBAYARAN:
        'view_pembayaran',

    APPROVE_PEMBAYARAN:
        'approve_pembayaran',

    /*
     |-------------------------------------------------------------
     | PENGELUARAN
     |-------------------------------------------------------------
     */

    VIEW_PENGELUARAN:
        'view_pengeluaran',

    MANAGE_PENGELUARAN:
        'manage_pengeluaran',

    APPROVE_PENGELUARAN:
        'approve_pengeluaran',

    /*
     |-------------------------------------------------------------
     | LEDGER
     |-------------------------------------------------------------
     */

    VIEW_LEDGER:
        'view_ledger',

    /*
     |-------------------------------------------------------------
     | REPORTING
     |-------------------------------------------------------------
     */

    VIEW_REPORTING:
        'view_reporting',

    /*
     |-------------------------------------------------------------
     | ACTIVITY
     |-------------------------------------------------------------
     */

    VIEW_ACTIVITY:
        'view_activity',

    /*
     |-------------------------------------------------------------
     | NOTIFICATIONS
     |-------------------------------------------------------------
     */

    VIEW_NOTIFICATIONS:
        'view_notifications'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]