'use client'

import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ActivityDrawer({ open, row, onClose }: { open: boolean; row: any | null; onClose: () => void }) {
    const t = useTranslations('activity')

    if (!open || !row) return null

    return (
        <div
            className="fixed inset-0 bg-black/20 z-50 flex justify-end"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-default"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">{t('drawer.title')}</h2>
                    <button onClick={onClose}>{t('drawer.close')}</button>
                </div>

                <div className="space-y-4 text-sm">

                    <div>
                        <p className="text-dark-5">{t('drawer.actor')}</p>
                        <p className="font-medium">{row.actorName}</p>
                    </div>

                    <div>
                        <p className="text-dark-5">{t('drawer.action')}</p>
                        <p className="font-medium">{row.action}</p>
                    </div>

                    <div>
                        <p className="text-dark-5">{t('drawer.entity')}</p>
                        <p className="font-medium">{row.entityType}</p>
                    </div>

                    <div>
                        <p className="text-dark-5">{t('drawer.description')}</p>
                        <p>{row.description}</p>
                    </div>

                    <div>
                        <p className="text-dark-5">{t('drawer.metadata')}</p>
                        <pre className="bg-body p-4 rounded-lg overflow-auto text-xs">
                            {JSON.stringify(row.metadata, null, 2)}
                        </pre>
                    </div>

                </div>
            </div>
        </div>
    )
}
