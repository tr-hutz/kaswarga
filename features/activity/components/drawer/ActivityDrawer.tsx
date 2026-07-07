// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function ActivityDrawer({ open, row, onClose }) {
    const t = useTranslations('activity')

    if (!open || !row) return null

    return (
        <div
            className="fixed inset-0 bg-black/20 z-50 flex justify-end"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">{t('drawer.title')}</h2>
                    <button onClick={onClose}>{t('drawer.close')}</button>
                </div>

                <div className="space-y-4 text-sm">

                    <div>
                        <p className="text-slate-500">{t('drawer.actor')}</p>
                        <p className="font-medium">{row.actorName}</p>
                    </div>

                    <div>
                        <p className="text-slate-500">{t('drawer.action')}</p>
                        <p className="font-medium">{row.action}</p>
                    </div>

                    <div>
                        <p className="text-slate-500">{t('drawer.entity')}</p>
                        <p className="font-medium">{row.entityType}</p>
                    </div>

                    <div>
                        <p className="text-slate-500">{t('drawer.description')}</p>
                        <p>{row.description}</p>
                    </div>

                    <div>
                        <p className="text-slate-500">{t('drawer.metadata')}</p>
                        <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-xs">
                            {JSON.stringify(row.metadata, null, 2)}
                        </pre>
                    </div>

                </div>
            </div>
        </div>
    )
}
