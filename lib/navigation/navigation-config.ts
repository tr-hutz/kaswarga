import type { IconName } from '@/components/ui/Icon'
import { PERMISSIONS } from '../permissions/permission-constants'

interface NavItem {
    label: string
    href: string
    icon: IconName
    permission: string | null
    hideForRoles?: string[]
}

export const NAVIGATION: NavItem[] = [

    /*
     |-------------------------------------------------------------
     | SUPER ADMIN ONLY
     |-------------------------------------------------------------
     */

    {
        label: 'rt',
        href: '/rt',
        icon: 'building2',
        permission: PERMISSIONS.MANAGE_RT
    },

    {
        label: 'rtRegistration',
        href: '/rt/registration',
        icon: 'clipboard-list',
        permission: PERMISSIONS.MANAGE_RT
    },

    {
        label: 'users',
        href: '/users',
        icon: 'user-cog',
        permission: PERMISSIONS.MANAGE_USERS
    },

    /*
     |-------------------------------------------------------------
     | GENERAL
     |-------------------------------------------------------------
     */

    {
        label: 'home',
        href: '/',
        icon: 'home',
        permission: null,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'dashboard',
        href: '/dashboard',
        icon: 'layout-dashboard',
        permission: null,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'residents',
        href: '/residents',
        icon: 'users',
        permission: PERMISSIONS.VIEW_RESIDENTS
    },

    {
        label: 'payments',
        href: '/payments',
        icon: 'wallet',
        permission: PERMISSIONS.VIEW_PAYMENTS
    },

    {
        label: 'expenses',
        href: '/expenses',
        icon: 'receipt',
        permission: PERMISSIONS.VIEW_EXPENSES
    },

    {
        label: 'ledger',
        href: '/ledger',
        icon: 'shelving-unit',
        permission: PERMISSIONS.VIEW_LEDGER
    },

    {
        label: 'notification',
        href: '/notification',
        icon: 'vibrate',
        permission: PERMISSIONS.VIEW_NOTIFICATIONS
    },

    {
        label: 'activity',
        href: '/activity',
        icon: 'activity',
        permission: PERMISSIONS.VIEW_ACTIVITY
    },

    {
        label: 'rtProfile',
        href: '/rt-profile',
        icon: 'settings',
        permission: PERMISSIONS.EDIT_RT_PROFILE
    },

    {
        label: 'roles',
        href: '/settings/authorization/roles',
        icon: 'shield',
        permission: PERMISSIONS.MANAGE_ROLES,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'permissionMatrix',
        href: '/settings/authorization/permissions',
        icon: 'properties',
        permission: PERMISSIONS.MANAGE_ROLES,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'memberOverrides',
        href: '/settings/authorization/overrides',
        icon: 'user-cog',
        permission: PERMISSIONS.MANAGE_ROLES,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'effectivePermissions',
        href: '/settings/authorization/viewer',
        icon: 'eye',
        permission: PERMISSIONS.MANAGE_ROLES,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'authorizationDebug',
        href: '/settings/authorization/debug',
        icon: 'monitor',
        permission: PERMISSIONS.MANAGE_ROLES,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'changePassword',
        href: '/change-password',
        icon: 'key-round',
        permission: null
    }
]
