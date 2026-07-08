export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    CHAIR:       'CHAIR',
    ADMIN:       'ADMIN',
    TREASURER:   'TREASURER',
    RESIDENT:    'RESIDENT'
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
     | RT PROFILE (chair / admin / treasurer — own RT only)
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
     | RESIDENTS
     |-------------------------------------------------------------
     */

    VIEW_RESIDENTS:
        'view_residents',

    MANAGE_RESIDENTS:
        'manage_residents',

    /*
     |-------------------------------------------------------------
     | PAYMENTS
     |-------------------------------------------------------------
     */

    VIEW_PAYMENTS:
        'view_payments',

    APPROVE_PAYMENTS:
        'approve_payments',

    /*
     |-------------------------------------------------------------
     | EXPENSES
     |-------------------------------------------------------------
     */

    VIEW_EXPENSES:
        'view_expenses',

    MANAGE_EXPENSES:
        'manage_expenses',

    APPROVE_EXPENSES:
        'approve_expenses',

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
