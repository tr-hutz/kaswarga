'use client'

import { useDashboardAnalytics }    from './hooks/useDashboardAnalytics'
import { usePaymentLedgerExport }   from '@/features/payment/hooks/usePaymentLedgerExport'
import { useToast }                 from '@/components/ui/ToastProvider'
import DashboardView                from './components/DashboardView'

export default function DashboardContainer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { toast } = (useToast() as any)

    const dashboard = useDashboardAnalytics()
    const { exportLoading, handleExportLedger } = usePaymentLedgerExport()

    async function onExportLedger() {
        try {
            await handleExportLedger(dashboard.year)
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        }
    }

    return (
        <DashboardView
            {...dashboard}
            exportLoading={exportLoading}
            onExportLedger={onExportLedger}
        />
    )
}
