'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { useAuth }  from '@/lib/auth/useAuth'
import { findResidentsWithPaymentsForLedger } from '@/lib/repositories/resident.repository'
import { exportPaymentLedger }               from '@/lib/export/payment-ledger-excel'

export function usePaymentLedgerExport() {
    const { membership } = (useAuth() as any) ?? {}
    const rtId       = membership?.rt?.id          as string | undefined
    const rtName     = membership?.rt?.name        as string | undefined
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
            })
        } finally {
            setExportLoading(false)
        }
    }

    return { exportLoading, handleExportLedger }
}
