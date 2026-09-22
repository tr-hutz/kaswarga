'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }  from 'react'
import { useAuth }   from '@/lib/auth/useAuth'
import { useToast }  from '@/components/ui/ToastProvider'
import { logActivity } from '@/lib/services/activity-logger'
import { findResidentsWithPaymentsForLedger } from '@/lib/repositories/resident.repository'
import { exportPaymentLedger }               from '@/lib/export/payment-ledger-excel'

export function usePaymentLedgerExport() {
    const { membership } = useAuth()
    const { toast }      = useToast()

    const rtId       = membership?.rt?.id          as string | undefined
    const rtName     = membership?.rt?.name        as string | undefined
    const rtCode     = membership?.rt?.code        as string | undefined
    const monthlyFee = membership?.rt?.monthly_fee as number | undefined

    const [exportLoading, setExportLoading] = useState(false)

    async function handleExportLedger(year: number) {
        if (!rtId) return
        setExportLoading(true)
        try {
            const residents = await findResidentsWithPaymentsForLedger(rtId, year)
            await exportPaymentLedger({
                rtName:     rtName ?? 'RT',
                year,
                residents,
                monthlyFee: monthlyFee ?? 0,
                password:   rtCode,
            })
            logActivity({
                rtId:        membership?.rt?.id,
                actorId:     membership?.user?.id,
                actorName:   membership?.user?.name,
                action:      'EXPORT',
                entityType:  'payments',
                description: `${membership?.user?.name ?? 'Pengguna'} mengekspor catatan iuran ${year}`,
            })
            if (process.env.NODE_ENV === 'production' && rtCode) {
                toast({ message: 'File dilindungi password. Gunakan kode RT untuk membuka.', type: 'success' })
            }
        } finally {
            setExportLoading(false)
        }
    }

    return { exportLoading, handleExportLedger }
}
