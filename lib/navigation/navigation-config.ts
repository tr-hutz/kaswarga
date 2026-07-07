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
        href: '/rt/registrasi',
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
        hideForRoles: ['super_admin']
    },

    {
        label: 'dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: null,
        hideForRoles: ['super_admin']
    },

    {
        label: 'warga',
        href: '/warga',
        icon: Users,
        permission: PERMISSIONS.VIEW_WARGA
    },

    {
        label: 'pembayaran',
        href: '/pembayaran',
        icon: Wallet,
        permission: PERMISSIONS.VIEW_PEMBAYARAN
    },

    {
        label: 'pengeluaran',
        href: '/pengeluaran',
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
        href: '/profil-rt',
        icon: Settings,
        permission: PERMISSIONS.EDIT_RT_PROFILE
    },

    {
        label: 'changePassword',
        href: '/ganti-password',
        icon: KeyRound,
        permission: null
    }
]