'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'
import { useKeyDown } from '../../../../lib/hooks/useKeyDown'

interface LedgerDrawerProps {
    open:    boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row:     any
    onClose: () => void
}

export default function LedgerDrawer({ open, row, onClose }: LedgerDrawerProps) {

    const t = useTranslations('ledger')

    useKeyDown(open, { Escape: onClose })

    if (!open || !row) return null

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/30"
            onClick={onClose}
        >
            <div className="w-full max-w-lg bg-surface h-full overflow-y-auto shadow-default">

                <div className="px-6 py-5 border-b border-divider flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{t('drawer.title')}</h2>
                        <p className="text-sm text-muted mt-0.5">{t('drawer.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="text-subtle hover:text-foreground mt-0.5">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <p className="text-sm text-muted">{t('drawer.type')}</p>
                            <p className="font-medium">{row.type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted">{t('drawer.description')}</p>
                            <p className="font-medium">{row.description}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted">{t('drawer.amount')}</p>
                            <p className="text-lg font-semibold">{row.amountLabel}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted">{t('drawer.balanceAfter')}</p>
                            <p className="text-lg font-semibold">{row.balanceLabel}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-muted">{t('drawer.date')}</p>
                            <p className="font-medium">
                                {row.date ? new Date(row.date).toLocaleString('id-ID') : '-'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
