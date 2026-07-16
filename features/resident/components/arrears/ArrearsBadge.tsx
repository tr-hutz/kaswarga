'use client'

import { useTranslations } from 'next-intl'

export default function ArrearsBadge({ total = 0 }: { total?: number }) {

    const tPaymentStatus = useTranslations('common.paymentStatus')
    const tArrears       = useTranslations('residents.arrears')

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
      {tArrears('badge', { total })}
    </span>
    )
}