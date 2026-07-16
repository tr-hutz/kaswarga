'use client'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useTranslations } from 'next-intl'

interface RtDeleteConfirmProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rt:        any
    onConfirm: () => void
    onCancel:  () => void
    loading:   boolean
}

export default function RtDeleteConfirm({ rt, onConfirm, onCancel, loading }: RtDeleteConfirmProps) {
    const t  = useTranslations('rt')
    const tc = useTranslations('common')

    return (
        <ConfirmDialog
            open={!!rt}
            title={t('delete.title')}
            message={t('delete.message', { name: rt?.name ?? '' })}
            confirmLabel={loading ? tc('states.deleting') : tc('actions.delete')}
            cancelLabel={tc('actions.cancel')}
            loading={loading}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    )
}
