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
        label: 'Kelola RT',
        href: '/rt',
        icon: Building2,
        permission: PERMISSIONS.MANAGE_RT
    },

    {
        label: 'Pendaftaran RT',
        href: '/rt/registrasi',
        icon: ClipboardList,
        permission: PERMISSIONS.MANAGE_RT
    },

    {
        label: 'Kelola Users',
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
        label: 'Beranda',
        href: '/',
        icon: Home,
        permission: null,
        hideForRoles: ['super_admin']
    },

    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: null,
        hideForRoles: ['super_admin']
    },

    {
        label: 'Warga',
        href: '/warga',
        icon: Users,
        permission: PERMISSIONS.VIEW_WARGA
    },

    {
        label: 'Pembayaran',
        href: '/pembayaran',
        icon: Wallet,
        permission: PERMISSIONS.VIEW_PEMBAYARAN
    },

    {
        label: 'Pengeluaran',
        href: '/pengeluaran',
        icon: Receipt,
        permission: PERMISSIONS.VIEW_PENGELUARAN
    },

    {
        label: 'Ledger',
        href: '/ledger',
        icon: ShelvingUnit,
        permission: PERMISSIONS.VIEW_LEDGER
    },

    {
        label: 'Notifikasi',
        href: '/notification',
        icon: Vibrate,
        permission: PERMISSIONS.VIEW_NOTIFICATIONS
    },

    {
        label: 'Aktivitas',
        href: '/activity',
        icon: Activity,
        permission: PERMISSIONS.VIEW_ACTIVITY
    },

    {
        label: 'Profil RT',
        href: '/profil-rt',
        icon: Settings,
        permission: PERMISSIONS.EDIT_RT_PROFILE
    },

    {
        label: 'Ganti Password',
        href: '/ganti-password',
        icon: KeyRound,
        permission: null
    }
]