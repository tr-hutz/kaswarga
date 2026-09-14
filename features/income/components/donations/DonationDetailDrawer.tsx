'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useTranslations }     from 'next-intl'
import { formatRupiah }        from '@/lib/utils'
import Icon                    from '@/components/ui/Icon'
import Can                     from '@/components/ui/Can'
import { PERMISSION }          from '@/lib/auth/types'
import DonationProgressBar     from '@/components/common/DonationProgressBar'

interface Props {
    open:       boolean
    donation:   any
    onClose:    () => void
    onActivate: (id: string) => void
    onCancel:   (id: string, note?: string) => void
}

export default function DonationDetailDrawer({ open, donation, onClose, onActivate, onCancel }: Props) {
    const t = useTranslations('income.donations')

    const [detail,       setDetail]      = useState<any>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [cancelNote,   setCancelNote]  = useState('')
    const [showCancel,   setShowCancel]  = useState(false)
    const [actionError,  setActionError] = useState<string | null>(null)

    useEffect(() => {
        if (!open || !donation?.id) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDetail(null)
        setShowCancel(false)
        setCancelNote('')
        setActionError(null)

        setLoadingDetail(true)
        fetch(`/api/income/donations/${donation.id}`)
            .then(r => r.json())
            .then(setDetail)
            .catch(() => {})
            .finally(() => setLoadingDetail(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, donation?.id])

    if (!open || !donation) return null

    const data = detail ?? donation

    const statusColors: Record<string, string> = {
        DRAFT:     'bg-muted/20 text-muted',
        ACTIVE:    'bg-success/10 text-success',
        COMPLETED: 'bg-primary/10 text-primary',
        CANCELLED: 'bg-danger/10 text-danger',
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div
                data-testid="donation-detail-drawer"
                className="w-full max-w-md h-full bg-surface shadow-xl overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">{t('detail.title')}</h2>
                    <button onClick={onClose} className="text-subtle hover:text-foreground">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Name + status */}
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">{data.name}</h3>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[data.status] ?? ''}`}>
                            {t(`status.${data.status}` as any)}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="bg-canvas rounded-lg p-4">
                        <DonationProgressBar
                            approved={data.approved_amount ?? 0}
                            pending={data.pending_amount  ?? 0}
                            target={data.target_amount    ?? null}
                        />
                    </div>

                    {/* Period, code prefix, donor count, description */}
                    <div className="text-sm space-y-2">
                        {(data.starts_at || data.ends_at) && (
                            <div>
                                <span className="text-muted">{t('detail.period')}: </span>
                                <span className="text-foreground">
                                    {data.starts_at ? new Date(data.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                    {data.ends_at ? ` — ${new Date(data.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                </span>
                            </div>
                        )}
                        {data.donation_code && (
                            <div>
                                <span className="text-muted">{t('columns.donationCode')}: </span>
                                <span className="font-mono text-foreground">{data.donation_code}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-muted">{t('columns.donorCount')}: </span>
                            <span className="text-foreground">{data.donor_count ?? 0}</span>
                        </div>
                        {data.description && (
                            <div>
                                <span className="text-muted">{t('detail.description')}: </span>
                                <span className="text-foreground">{data.description}</span>
                            </div>
                        )}
                    </div>

                    {/* Monetary contributions */}
                    {!loadingDetail && (
                        <>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">
                                    {t('detail.monetaryList')} ({(detail?.monetary ?? []).length})
                                </h4>
                                {(detail?.monetary ?? []).length === 0 ? (
                                    <p className="text-xs text-muted">{t('detail.noDonations')}</p>
                                ) : (
                                    <div className="space-y-1">
                                        {(detail?.monetary ?? []).map((row: any) => (
                                            <div key={row.id} className="flex justify-between items-center text-xs py-1 border-b border-divider last:border-0">
                                                <div>
                                                    <span className="text-foreground font-medium">
                                                        {row.is_anonymous ? 'Anonim' : (row.residents?.name ?? row.payer_name ?? '—')}
                                                    </span>
                                                    {row.contribution_code && (
                                                        <span className="ml-2 font-mono text-primary">{row.contribution_code}</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-foreground">{formatRupiah(row.amount)}</div>
                                                    <div className="text-muted">
                                                        {row.received_at ? new Date(row.received_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* In-kind contributions */}
                            {(detail?.inKind ?? []).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">
                                        {t('detail.inKindList')} ({(detail?.inKind ?? []).length})
                                    </h4>
                                    <div className="space-y-1">
                                        {(detail?.inKind ?? []).map((row: any) => (
                                            <div key={row.id} className="text-xs py-1 border-b border-divider last:border-0">
                                                <div className="flex justify-between">
                                                    <span className="text-foreground">{row.in_kind_description ?? '—'}</span>
                                                    {row.amount > 0 && <span className="text-muted">est. {formatRupiah(row.amount)}</span>}
                                                </div>
                                                {(row.in_kind_quantity || row.in_kind_unit) && (
                                                    <span className="text-muted">
                                                        {row.in_kind_quantity} {row.in_kind_unit}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Action error message */}
                    {actionError && (
                        <div className="rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
                            {actionError}
                        </div>
                    )}

                    {/* Actions for RT Chair: activate or cancel */}
                    <Can permission={PERMISSION.INCOME_DONATION_ACTIVATE}>
                        {['DRAFT', 'ACTIVE'].includes(data.status) && (
                            <div className="flex gap-2 pt-2">
                                {data.status === 'DRAFT' && (
                                    <button
                                        data-testid="donation-activate-btn"
                                        onClick={async () => {
                                            setActionError(null)
                                            try { await onActivate(data.id) }
                                            catch (e: any) { setActionError(e?.message ?? 'Gagal mengaktifkan') }
                                        }}
                                        className="flex-1 bg-success hover:bg-success/80 text-white text-sm rounded-lg py-2"
                                    >
                                        {t('actions.activate')}
                                    </button>
                                )}
                                <button
                                    onClick={() => { setActionError(null); setShowCancel(true) }}
                                    className="flex-1 border border-danger/40 text-danger text-sm rounded-lg py-2 hover:bg-danger/5"
                                >
                                    {t('actions.cancel')}
                                </button>
                            </div>
                        )}
                    </Can>

                    {/* Cancel note input */}
                    {showCancel && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                {t('actions.cancelNote')}
                            </label>
                            <textarea
                                value={cancelNote}
                                onChange={e => setCancelNote(e.target.value)}
                                rows={3}
                                className="w-full border border-divider rounded-lg px-3 py-2 text-sm bg-input text-foreground resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCancel(false)}
                                    className="flex-1 border border-divider text-sm rounded-lg py-2"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={async () => {
                                        setActionError(null)
                                        try { await onCancel(data.id, cancelNote) }
                                        catch (e: any) { setActionError(e?.message ?? 'Gagal membatalkan'); setShowCancel(false) }
                                    }}
                                    className="flex-1 bg-danger hover:bg-danger/80 text-white text-sm rounded-lg py-2"
                                >
                                    Konfirmasi
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
