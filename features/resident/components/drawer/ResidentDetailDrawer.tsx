'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

import ResidentDetailSummary
    from '../detail/ResidentDetailSummary'

import ResidentPaymentHistory
    from './ResidentPaymentHistory'

interface ResidentDetailDrawerProps {
    open:     boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resident: any
    onClose:  () => void
}

export default function ResidentDetailDrawer({

                                              open,

                                              resident,

                                              onClose

                                          }: ResidentDetailDrawerProps) {

    const t = useTranslations('residents')

    if (!open || !resident) {
        return null
    }

    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                justify-end
                bg-black/30
            "

            onClick={onClose}
        >

            <div
                className="
                    h-full
                    w-full
                    max-w-lg
                    bg-surface
                    shadow-default
                    p-6
                    overflow-y-auto
                "
            >

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        mb-6
                    "
                >

                    <h1
                        className="
                            text-xl
                            font-semibold
                            text-foreground
                        "
                    >
                        {t('drawer.title')}
                    </h1>

                    <button
                        onClick={onClose}
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>

                </div>

                <ResidentDetailSummary
                    resident={resident}
                />

                <ResidentPaymentHistory
                    paymentHistory={
                        resident?.paymentHistory || []
                    }
                />

            </div>

        </div>
    )
}