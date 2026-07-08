// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function TunggakanBadge({

                                           total = 0

                                       }) {

    const tPaymentStatus = useTranslations('common.paymentStatus')
    const tTunggakan     = useTranslations('residents.tunggakan')

    if (total <= 0) {

        return (

            <span
                className="
          px-3
          py-1
          rounded-full
          text-sm
          bg-emerald-100
          text-emerald-700
        "
            >
        {tPaymentStatus('paid')}
      </span>
        )
    }

    return (

        <span
            className="
        px-3
        py-1
        rounded-full
        text-sm
        bg-rose-100
        text-rose-700
      "
        >
      {tTunggakan('badge', { total })}
    </span>
    )
}