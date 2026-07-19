'use client'
import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentSummary({ summary }: { summary: any }) {

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
          border-divider
          bg-surface
          shadow-card
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
          border-divider
          bg-surface
          shadow-card
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
          border-divider
          bg-surface
          shadow-card
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