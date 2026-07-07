// @ts-nocheck
'use client'
import { useTranslations } from 'next-intl'

export default function PaymentSummary({

  summary

}) {

  const t = useTranslations('home')

  return (

    <div
      className="
        grid
        grid-cols-3
        gap-4
      "
    >

      <div
        className="
          rounded-xl
          border
          p-4
        "
      >
        <div>
          {t('summary.paid')}
        </div>

        <div
          className="
            text-2xl
            font-bold
          "
        >
          {summary.paid}
        </div>
      </div>

      <div
        className="
          rounded-xl
          border
          p-4
        "
      >
        <div>
          {t('summary.arrears')}
        </div>

        <div
          className="
            text-2xl
            font-bold
          "
        >
          {summary.arrears}
        </div>
      </div>

      <div
        className="
          rounded-xl
          border
          p-4
        "
      >
        <div>
          {t('summary.upcoming')}
        </div>

        <div
          className="
            text-2xl
            font-bold
          "
        >
          {summary.upcoming}
        </div>
      </div>

    </div>
  )
}