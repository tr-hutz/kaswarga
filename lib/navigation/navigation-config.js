import {

    Home,
    LayoutDashboard,
    Users,
    Wallet,
    Receipt,
    ShelvingUnit,
    Vibrate,
    Activity

} from 'lucide-react'

import {

    PERMISSIONS

} from '../permissions/permission-constants'

export const NAVIGATION = [

    {
        label: 'Beranda',

        href: '/',

        icon: Home,

        permission: null
    },

    {
        label: 'Dashboard',

        href: '/dashboard',

        icon: LayoutDashboard,

        permission: null
    },

    {
        label: 'Warga',

        href: '/warga',

        icon: Users,

        permission:

        PERMISSIONS.VIEW_WARGA
    },

    {
        label: 'Pembayaran',

        href: '/pembayaran',

        icon: Wallet,

        permission:

        PERMISSIONS.VIEW_PEMBAYARAN
    },

    {
        label: 'Pengeluaran',

        href: '/pengeluaran',

        icon: Receipt,

        permission:

        PERMISSIONS.VIEW_PENGELUARAN
    },

    {
        label: 'Ledger',

        href: '/ledger',

        icon: ShelvingUnit,

        permission:

        PERMISSIONS.VIEW_LEDGER
    },

    {
        label: 'Notifikasi',

        href: '/notification',

        icon: Vibrate,

        permission:

        PERMISSIONS.VIEW_NOTIFICATIONS
    },

    {
        label: 'Aktivitas',

        href: '/activity',

        icon: Activity,

        permission:

        PERMISSIONS.VIEW_ACTIVITY
    }
]