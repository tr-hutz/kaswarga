'use client'

import Icon from '@/components/ui/Icon'
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
                className="w-full max-w-lg bg-surface h-full overflow-y-auto shadow-default"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-divider flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{t('drawer.title')}</h2>
                        <p className="text-sm text-muted mt-0.5">{t('drawer.subtitle')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-subtle hover:text-foreground mt-0.5"
                        aria-label="Tutup"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4 text-sm">

                    <div>
                        <p className="text-muted">{t('drawer.actor')}</p>
                        <p className="font-medium">{row.actorName}</p>
                    </div>

                    <div>
                        <p className="text-muted">{t('drawer.action')}</p>
                        <p className="font-medium">{row.action}</p>
                    </div>

                    <div>
                        <p className="text-muted">{t('drawer.entity')}</p>
                        <p className="font-medium">{row.entityType}</p>
                    </div>

                    <div>
                        <p className="text-muted">{t('drawer.description')}</p>
                        <p>{row.description}</p>
                    </div>

                    <div>
                        <p className="text-muted">{t('drawer.metadata')}</p>
                        <pre className="bg-canvas p-4 rounded-lg overflow-auto text-xs">
                            {JSON.stringify(row.metadata, null, 2)}
                        </pre>
                    </div>

                </div>
            </div>
        </div>
    )
}
