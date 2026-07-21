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
          bg-success/10
          text-success
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
        bg-danger/10
        text-danger
      "
        >
      {tArrears('badge', { total })}
    </span>
    )
}