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
        <div className="text-sm text-muted">
          {t('summary.paid')}
        </div>

        <div
          className="
            text-2xl
            font-bold
            text-foreground
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
        <div className="text-sm text-muted">
          {t('summary.arrears')}
        </div>

        <div
          className="
            text-2xl
            font-bold
            text-foreground
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
        <div className="text-sm text-muted">
          {t('summary.upcoming')}
        </div>

        <div
          className="
            text-2xl
            font-bold
            text-foreground
          "
        >
          {summary.upcoming}
        </div>
      </div>

    </div>
  )
}