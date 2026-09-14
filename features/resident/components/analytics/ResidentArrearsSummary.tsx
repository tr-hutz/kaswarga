'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState }  from 'react'
import { useTranslations }    from 'next-intl'
import { useDialog }          from '@/components/ui/DialogProvider'
import { useToast }           from '@/components/ui/ToastProvider'
import { buildArrearRows }    from '@/features/resident/services/tunggakan-transform'
import type { ConfirmationEntry } from '@/features/resident/services/tunggakan-transform'
import PaymentDetailDrawer    from '@/features/payment/components/details/PaymentDetailDrawer'
import { approvePayment, rejectPayment } from '@/lib/services/payment.service'
import { getErrorMessage }    from '@/lib/errors/supabase-errors'
import Icon                   from '@/components/ui/Icon'

interface Props {
    residentAnalytics: any[]
    monthlyFee:        number
    year:              number
    onRefresh?:        () => void
}

export default function ResidentArrearsSummary({
    residentAnalytics,
    monthlyFee,
    year,
    onRefresh,
}: Props) {

    const t  = useTranslations('dashboard.arrearsSummary')
    const tp = useTranslations('payments')
    const { prompt }  = useDialog()
    const { toast }   = useToast()

    const [search,         setSearch        ] = useState('')
    const [queue,          setQueue         ] = useState<ConfirmationEntry[]>([])
    const [queueIdx,       setQueueIdx      ] = useState(0)
    const [approvalLoading, setApprovalLoading] = useState(false)

    // -------------------------------------------------------------------------
    // Derived drawer state
    // -------------------------------------------------------------------------
    const drawerOpen  = queue.length > 0
    const currentConf = drawerOpen ? queue[queueIdx] : null
    const headerNote  = queue.length > 1
        ? `Pending ${queueIdx + 1} dari ${queue.length}`
        : undefined

    // -------------------------------------------------------------------------
    // Queue management
    // -------------------------------------------------------------------------
    function openQueue(confs: ConfirmationEntry[]) {
        setQueue(confs)
        setQueueIdx(0)
    }

    function advanceOrClose(idx: number, total: number) {
        if (idx + 1 < total) {
            setQueueIdx(idx + 1)
        } else {
            setQueue([])
            setQueueIdx(0)
            onRefresh?.()
        }
    }

    function handleClose() {
        const anyDone = queueIdx > 0
        setQueue([])
        setQueueIdx(0)
        if (anyDone) onRefresh?.()
    }

    // -------------------------------------------------------------------------
    // Approve / Reject (call service directly for precise queue control)
    // -------------------------------------------------------------------------
    async function handleApprove(payment: any) {
        try {
            setApprovalLoading(true)
            await approvePayment(payment.id)
            toast({ message: tp('approval.approveSuccess'), type: 'success' })
            advanceOrClose(queueIdx, queue.length)
        } catch (err) {
            toast({ message: getErrorMessage(err), type: 'error' })
        } finally {
            setApprovalLoading(false)
        }
    }

    async function handleReject(payment: any) {
        const reason = await prompt({
            title:            tp('reject.title'),
            description:      tp('reject.description'),
            placeholder:      tp('reject.placeholder'),
            confirmLabel:     tp('reject.confirmLabel'),
            confirmClassName: 'bg-danger hover:bg-danger/80 text-white',
        })
        if (!reason) return
        try {
            setApprovalLoading(true)
            await rejectPayment(payment.id, reason)
            toast({ message: tp('approval.rejectSuccess'), type: 'success' })
            advanceOrClose(queueIdx, queue.length)
        } catch (err) {
            toast({ message: getErrorMessage(err), type: 'error' })
        } finally {
            setApprovalLoading(false)
        }
    }

    // -------------------------------------------------------------------------
    // Data
    // -------------------------------------------------------------------------
    const rows = useMemo(
        () => buildArrearRows(residentAnalytics, year, monthlyFee),
        [residentAnalytics, year, monthlyFee],
    )

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return rows
        return rows.filter(r =>
            r.name.toLowerCase().includes(q)              ||
            r.block.toLowerCase().includes(q)             ||
            String(r.houseNumber).toLowerCase().includes(q)
        )
    }, [rows, search])

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <div className="space-y-3">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        {t('title')}
                    </h2>
                    <p className="text-xs text-subtle mt-0.5">
                        {t('subtitle', { year })}
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Icon
                        name="search"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="
                            w-full pl-9 pr-3 py-2 text-sm
                            border border-divider rounded-lg
                            bg-input text-foreground
                            placeholder:text-muted
                            focus:outline-none focus:border-primary
                        "
                    />
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="bg-surface rounded-lg shadow-card p-8 text-center text-sm text-muted">
                    {t('empty')}
                </div>
            ) : (
                <div className="bg-surface rounded-lg shadow-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-divider text-left">
                                <th className="px-4 py-3 font-medium text-muted whitespace-nowrap">
                                    {t('columns.name')}
                                </th>
                                <th className="px-4 py-3 font-medium text-muted whitespace-nowrap">
                                    {t('columns.address')}
                                </th>
                                <th className="px-4 py-3 font-medium text-muted whitespace-nowrap text-center">
                                    {t('columns.paid')}
                                </th>
                                <th className="px-4 py-3 font-medium text-muted whitespace-nowrap text-center">
                                    {t('columns.arrears')}
                                </th>
                                <th className="px-4 py-3 font-medium text-muted whitespace-nowrap text-right">
                                    {t('columns.owed')}
                                </th>
                                <th className="px-4 py-3 font-medium text-muted whitespace-nowrap text-center">
                                    {t('columns.confirmations')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    className={`border-b border-divider last:border-0 ${idx % 2 === 1 ? 'bg-canvas' : ''}`}
                                >
                                    {/* Name */}
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                        {row.name}
                                    </td>

                                    {/* Address */}
                                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                                        {row.block} / {row.houseNumber}
                                    </td>

                                    {/* Paid months count */}
                                    <td className="px-4 py-3 text-center text-foreground">
                                        {row.paidMonths.length > 0
                                            ? `${row.paidMonths.length} bln`
                                            : <span className="text-muted">-</span>
                                        }
                                    </td>

                                    {/* Arrear months count */}
                                    <td className="px-4 py-3 text-center font-medium text-danger">
                                        {row.arrearMonths.length} bln
                                    </td>

                                    {/* Amount owed */}
                                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                                        Rp {row.totalOwed.toLocaleString('id-ID')}
                                    </td>

                                    {/* Pending confirmations */}
                                    <td className="px-4 py-3 text-center">
                                        {row.confirmations.length === 0 ? (
                                            <span className="text-muted">-</span>
                                        ) : (
                                            <div className="inline-flex items-center gap-2">
                                                <span className="text-foreground">
                                                    {row.confirmations.length} antrian
                                                </span>
                                                <button
                                                    type="button"
                                                    title="Tinjau konfirmasi"
                                                    onClick={() => openQueue(row.confirmations)}
                                                    className="
                                                        p-1.5 rounded-md
                                                        text-muted hover:text-foreground
                                                        hover:bg-muted/10
                                                        transition-colors
                                                    "
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Queue drawer */}
            <PaymentDetailDrawer
                open={drawerOpen}
                payment={currentConf}
                onClose={handleClose}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={approvalLoading}
                headerNote={headerNote}
            />

        </div>
    )
}
