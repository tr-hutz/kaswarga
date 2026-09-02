'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { isPending } from '@/features/expense/services/expense-status'
import { useTranslations } from 'next-intl'

interface ExpenseApprovalBarProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row:       any
    onApprove: (id: string) => void
    onReject:  (id: string, reason: string) => void
    loading:   boolean
}

export default function ExpenseApprovalBar({ row, onApprove, onReject, loading }: ExpenseApprovalBarProps) {

    const t = useTranslations('expenses')
    const tc = useTranslations('common')
    const [rejectMode, setRejectMode] = useState(false)
    const [alasan,     setAlasan]     = useState('')

    if (!row || !isPending(row.status)) return null

    if (rejectMode) {
        return (
            <div className="space-y-3 pt-4 border-t border-divider">
                <p className="text-sm font-medium text-foreground">{t('approvalBar.rejectReason')}</p>
                <textarea
                    value={alasan}
                    onChange={e => setAlasan(e.target.value)}
                    placeholder={t('approvalBar.rejectReasonPlaceholder')}
                    rows={3}
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm resize-none bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setRejectMode(false)}
                        className="flex-1 border border-divider rounded-lg px-4 py-2 text-sm"
                    >
                        {tc('actions.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onReject(row.id, alasan)}
                        disabled={loading}
                        className="flex-1 bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Icon name="loader2" size={14} className="animate-spin" />}
                        {t('approvalBar.confirmReject')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-3 pt-4 border-t border-divider">
            <button
                type="button"
                onClick={() => onApprove(row.id)}
                disabled={loading}
                className="flex-1 bg-success text-white rounded-lg px-4 py-3 font-medium hover:bg-success/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading && <Icon name="loader2" size={14} className="animate-spin" />}
                {tc('actions.approve')}
            </button>
            <button
                type="button"
                onClick={() => setRejectMode(true)}
                disabled={loading}
                className="flex-1 bg-danger text-white rounded-lg px-4 py-3 font-medium hover:bg-danger/90 transition disabled:opacity-50"
            >
                {tc('actions.reject')}
            </button>
        </div>
    )
}