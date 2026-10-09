'use client'

import { useState }        from 'react'
import { useTranslations } from 'next-intl'
import Icon                from '@/components/ui/Icon'

interface Props {
    sectionId: string
}

export default function GuideFeedback({ sectionId }: Props) {
    const t = useTranslations('guide.public.feedback')

    const [voted,   setVoted]   = useState<boolean | null>(null)
    const [loading, setLoading] = useState(false)

    async function vote(isHelpful: boolean) {
        if (loading || voted !== null) return
        setLoading(true)
        try {
            await fetch(`/api/guide/${sectionId}/feedback`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ is_helpful: isHelpful }),
            })
            setVoted(isHelpful)
        } finally {
            setLoading(false)
        }
    }

    if (voted !== null) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted">
                <Icon name={voted ? 'thumbs-up' : 'thumbs-down'} size={14} className="text-primary" />
                <span>{t('thanks')}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{t('question')}</span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => vote(true)}
                    disabled={loading}
                    title={t('yes')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm text-muted hover:text-foreground hover:bg-canvas border border-divider transition-colors disabled:opacity-50"
                >
                    <Icon name="thumbs-up" size={13} />
                    {t('yes')}
                </button>
                <button
                    onClick={() => vote(false)}
                    disabled={loading}
                    title={t('no')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm text-muted hover:text-foreground hover:bg-canvas border border-divider transition-colors disabled:opacity-50"
                >
                    <Icon name="thumbs-down" size={13} />
                    {t('no')}
                </button>
            </div>
        </div>
    )
}
