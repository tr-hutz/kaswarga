'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }      from 'react'
import { useAuth }       from '@/lib/auth/useAuth'
import { useToast }      from '@/components/ui/ToastProvider'
import { logActivity }   from '@/lib/services/activity-logger'
import { exportLedgerToExcel } from '@/features/ledger/services/ledger-export'
import { exportFileName }      from '@/lib/export/export-utils'

export function useLedgerActions() {

    const { membership }  = useAuth()
    const { toast }       = useToast()

    const [selectedRow, setSelectedRow] = useState<any>(null)
    const [drawerOpen,  setDrawerOpen]  = useState(false)

    function openDrawer(row: any) {
        setSelectedRow(row)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedRow(null)
    }

    async function exportExcel(rows: any[]) {
        const rtCode   = membership?.rt?.code ?? undefined
        const fileName = exportFileName(membership?.rt?.name ?? 'RT', 'buku-kas')
        await exportLedgerToExcel(rows as any, rtCode, fileName)
        logActivity({
            rtId:        membership?.rt?.id,
            actorId:     membership?.user?.id,
            actorName:   membership?.user?.name,
            action:      'EXPORT',
            entityType:  'ledger',
            description: `${membership?.user?.name ?? 'Pengguna'} mengekspor data buku kas`,
        })
        if (process.env.NODE_ENV === 'production' && rtCode) {
            toast({ message: 'File dilindungi password. Gunakan kode RT untuk membuka.', type: 'success' })
        }
    }

    return {
        selectedRow,
        drawerOpen,
        openDrawer,
        closeDrawer,
        exportExcel,
    }
}
