import type { IconName } from '@/components/ui/Icon'
import { PERMISSION, type Permission } from '@/lib/auth/types'

interface NavItem {
    label:      string
    href:       string
    icon:       IconName
    permission: Permission | null
    /** true = visible only when user has no RT (i.e. SUPER_ADMIN platform pages). */
    noRt?:      boolean
    /** true = visible only when user belongs to an RT (hidden from SUPER_ADMIN). */
    requiresRt?: boolean
}

export const NAVIGATION: NavItem[] = [

    /*
     |-------------------------------------------------------------
     | SUPER ADMIN ONLY — platform-level pages, hidden from RT members
     |-------------------------------------------------------------
     */

    {
        label:      'rt',
        href:       '/rt',
        icon:       'building2',
        permission: PERMISSION.USER_VIEW,
        noRt:       true,
    },

    {
        label:      'rtRegistration',
        href:       '/rt/registration',
        icon:       'clipboard-list',
        permission: PERMISSION.USER_VIEW,
        noRt:       true,
    },

    {
        label:      'users',
        href:       '/users',
        icon:       'user-cog',
        permission: PERMISSION.USER_VIEW,
        noRt:       true,
    },

    /*
     |-------------------------------------------------------------
     | GENERAL — RT members only (hidden from SUPER_ADMIN)
     |-------------------------------------------------------------
     */

    {
        label:       'home',
        href:        '/',
        icon:        'home',
        permission:  null,
        requiresRt:  true,
    },

    {
        label:       'dashboard',
        href:        '/dashboard',
        icon:        'layout-dashboard',
        permission:  null,
        requiresRt:  true,
    },

    {
        label:       'residents',
        href:        '/residents',
        icon:        'users',
        permission:  PERMISSION.RESIDENT_VIEW,
        requiresRt:  true,
    },

    {
        label:       'payments',
        href:        '/payments',
        icon:        'wallet',
        permission:  PERMISSION.PAYMENT_VIEW,
        requiresRt:  true,
    },

    {
        label:       'expenses',
        href:        '/expenses',
        icon:        'receipt',
        permission:  PERMISSION.EXPENSE_VIEW,
        requiresRt:  true,
    },

    {
        label:       'ledger',
        href:        '/ledger',
        icon:        'shelving-unit',
        permission:  PERMISSION.LEDGER_VIEW,
        requiresRt:  true,
    },

    {
        label:      'notification',
        href:       '/notification',
        icon:       'vibrate',
        permission: null,
    },

    {
        label:      'activity',
        href:       '/activity',
        icon:       'activity',
        permission: null,
    },

    {
        label:       'rtProfile',
        href:        '/rt-profile',
        icon:        'settings',
        permission:  PERMISSION.SETTINGS_VIEW,
        requiresRt:  true,
    },

    /*
     |-------------------------------------------------------------
     | RBAC SETTINGS — RT members with role management access
     |-------------------------------------------------------------
     */

    {
        label:       'roles',
        href:        '/settings/authorization/roles',
        icon:        'shield',
        permission:  PERMISSION.ROLE_VIEW,
        requiresRt:  true,
    },

    {
        label:       'permissionMatrix',
        href:        '/settings/authorization/permissions',
        icon:        'properties',
        permission:  PERMISSION.PERMISSION_VIEW,
        requiresRt:  true,
    },

    {
        label:       'memberOverrides',
        href:        '/settings/authorization/overrides',
        icon:        'user-cog',
        permission:  PERMISSION.PERMISSION_OVERRIDE,
        requiresRt:  true,
    },

    {
        label:       'effectivePermissions',
        href:        '/settings/authorization/viewer',
        icon:        'eye',
        permission:  PERMISSION.PERMISSION_VIEW,
        requiresRt:  true,
    },

    {
        label:       'permissionInspector',
        href:        '/settings/authorization/inspector',
        icon:        'search',
        permission:  PERMISSION.INSPECTOR_VIEW,
        requiresRt:  true,
    },

    /*
     |-------------------------------------------------------------
     | ACCOUNT
     |-------------------------------------------------------------
     */

    {
        label:      'changePassword',
        href:       '/change-password',
        icon:       'key-round',
        permission: null,
    },
]
