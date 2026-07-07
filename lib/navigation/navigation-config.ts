import {
    Home,
    LayoutDashboard,
    Users,
    Wallet,
    Receipt,
    ShelvingUnit,
    Vibrate,
    Activity,
    Building2,
    UserCog,
    Settings,
    KeyRound,
    ClipboardList
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import { PERMISSIONS } from '../permissions/permission-constants'

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
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
        icon: Building2,
        permission: PERMISSIONS.MANAGE_RT
    },

    {
        label: 'rtRegistration',
        href: '/rt/registration',
        icon: ClipboardList,
        permission: PERMISSIONS.MANAGE_RT
    },

    {
        label: 'users',
        href: '/users',
        icon: UserCog,
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
        icon: Home,
        permission: null,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: null,
        hideForRoles: ['SUPER_ADMIN']
    },

    {
        label: 'warga',
        href: '/residents',
        icon: Users,
        permission: PERMISSIONS.VIEW_WARGA
    },

    {
        label: 'pembayaran',
        href: '/payments',
        icon: Wallet,
        permission: PERMISSIONS.VIEW_PEMBAYARAN
    },

    {
        label: 'pengeluaran',
        href: '/expenses',
        icon: Receipt,
        permission: PERMISSIONS.VIEW_PENGELUARAN
    },

    {
        label: 'ledger',
        href: '/ledger',
        icon: ShelvingUnit,
        permission: PERMISSIONS.VIEW_LEDGER
    },

    {
        label: 'notification',
        href: '/notification',
        icon: Vibrate,
        permission: PERMISSIONS.VIEW_NOTIFICATIONS
    },

    {
        label: 'activity',
        href: '/activity',
        icon: Activity,
        permission: PERMISSIONS.VIEW_ACTIVITY
    },

    {
        label: 'profilRt',
        href: '/rt-profile',
        icon: Settings,
        permission: PERMISSIONS.EDIT_RT_PROFILE
    },

    {
        label: 'changePassword',
        href: '/change-password',
        icon: KeyRound,
        permission: null
    }
]