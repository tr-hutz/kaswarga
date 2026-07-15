// @ts-nocheck
'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'
import { useKeyDown } from '../../../../lib/hooks/useKeyDown'

export default function LedgerDrawer({ open, row, onClose }) {

    const t = useTranslations('ledger')

    useKeyDown(open, { Escape: onClose })

    if (!open || !row) return null

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/30"
            onClick={onClose}
        >
            <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl">

                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{t('drawer.title')}</h2>
                        <p className="text-sm text-slate-500">{t('drawer.subtitle')}</p>
                    </div>
                    <button onClick={onClose}>
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <div>
                        <p className="text-sm text-slate-500">{t('drawer.type')}</p>
                        <p className="font-medium">{row.type}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('drawer.source')}</p>
                        <p className="font-medium">{row.source}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('drawer.description')}</p>
                        <p className="font-medium">{row.description}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('drawer.amount')}</p>
                        <p className="text-lg font-semibold">{row.amountLabel}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('drawer.balanceAfter')}</p>
                        <p className="text-lg font-semibold">{row.balanceLabel}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('drawer.date')}</p>
                        <p className="font-medium">{row.date}</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
