'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

import ResidentDetailSummary from '../detail/ResidentDetailSummary'
import ResidentPaymentHistory from './ResidentPaymentHistory'
import { usePaymentHistory } from '../../hooks/usePaymentHistory'
import { useKeyDown } from '@/lib/hooks/useKeyDown'

interface ResidentDetailDrawerProps {
    open:               boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resident:           any
    onClose:            () => void
    role:               string
    currentResidentId?: string
}

export default function ResidentDetailDrawer({
    open,
    resident,
    onClose,
    role,
    currentResidentId,
}: ResidentDetailDrawerProps) {

    const t = useTranslations('residents')
    const currentYear = new Date().getFullYear()
    const [year, setYear] = useState(currentYear)

    useKeyDown(open, { Escape: onClose })

    const canViewPaymentHistory =
        role !== 'RESIDENT' || resident?.id === currentResidentId

    const { history, loading: historyLoading } = usePaymentHistory(
        canViewPaymentHistory ? resident?.id : null,
        year,
    )

    if (!open || !resident) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/30"
            onClick={onClose}
        >
            <div
                className="h-full w-full max-w-lg bg-surface shadow-default overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-divider flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            {t('drawer.title')}
                        </h1>
                        <p className="text-sm text-muted mt-0.5">{t('drawer.subtitle')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-subtle hover:text-foreground mt-0.5"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <ResidentDetailSummary resident={resident} />

                    {canViewPaymentHistory && (
                        <div className="mt-6">
                            <ResidentPaymentHistory
                                paymentHistory={history}
                                loading={historyLoading}
                                year={year}
                                onYearChange={setYear}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
