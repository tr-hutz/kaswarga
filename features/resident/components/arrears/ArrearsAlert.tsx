// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function ArrearsAlert({

                                           arrears = 0

                                       }) {

    const t = useTranslations('residents.arrears')

    if (arrears <= 0) {
        return null
    }

    return (

        <div
            className="
        bg-amber-50
        border
        border-amber-200
        text-amber-700
        rounded-2xl
        p-4
      "
        >

            {t('alert', { months: arrears })}

        </div>
    )
}