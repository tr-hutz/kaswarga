'use client'

import { useTranslations } from 'next-intl'
import { MONTHS } from '../../../../constants/months'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentDetailMonths({ details = [] }: { details?: any[] }) {
    const t = useTranslations('payments')

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3">
                {t('detail.monthsPaid')}
            </h3>
            <div className="flex flex-wrap gap-2">
                {details.map(detail => {
                    const month = MONTHS.find(item => Number(item.id) === Number(detail.bulan))
                    return (
                        <div key={detail.id} className="px-3 py-2 rounded-xl bg-slate-100 text-sm">
                            {month?.name}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
