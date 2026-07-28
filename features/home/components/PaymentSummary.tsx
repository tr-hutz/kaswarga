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

      {/* Lunas */}
      <div
        className="
          rounded-xl
          border border-success/20
          bg-success/5
          shadow-card
          p-4
          flex flex-col gap-1
        "
      >
        <div className="text-sm text-muted">
          {t('summary.paid')}
        </div>
        <div
          className="
            text-2xl
            font-bold
            text-success
          "
        >
          {summary.paid}
        </div>
        <div className="text-xs text-success/70">
          bulan
        </div>
      </div>

      {/* Tunggakan */}
      <div
        className={`
          rounded-xl
          border shadow-card p-4 flex flex-col gap-1
          ${summary.arrears > 0
            ? 'border-danger/20 bg-danger/5'
            : 'border-success/20 bg-success/5'
          }
        `}
      >
        <div className="text-sm text-muted">
          {t('summary.arrears')}
        </div>
        <div
          className={`
            text-2xl font-bold
            ${summary.arrears > 0 ? 'text-danger' : 'text-success'}
          `}
        >
          {summary.arrears}
        </div>
        <div className={`text-xs ${summary.arrears > 0 ? 'text-danger/70' : 'text-success/70'}`}>
          bulan
        </div>
      </div>

      {/* Mendatang */}
      <div
        className="
          rounded-xl
          border border-divider
          bg-surface
          shadow-card
          p-4
          flex flex-col gap-1
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
        <div className="text-xs text-muted">
          bulan
        </div>
      </div>

    </div>
  )
}
