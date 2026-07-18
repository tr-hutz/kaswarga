'use client'

import { useTranslations } from 'next-intl'

export default function ArrearsAlert({ arrears = 0 }: { arrears?: number }) {

    const t = useTranslations('residents.arrears')

    if (arrears <= 0) {
        return null
    }

    return (

        <div
            className="
        bg-warning/10
        border
        border-warning/30
        text-warning
        rounded-xl
        p-4
      "
        >

            {t('alert', { months: arrears })}

        </div>
    )
}