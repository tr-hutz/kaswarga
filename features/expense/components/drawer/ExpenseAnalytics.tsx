'use client'

import {
    formatRupiah
} from '../../../../lib/utils'
import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ExpenseAnalytics({ rows = [] }: { rows?: any[] }) {

    const t = useTranslations('expenses')

    /*
     |-------------------------------------------------------------
     | TOTAL
     |-------------------------------------------------------------
     */

    const totalExpense =
        rows.reduce(

            (
                sum,
                item
            ) =>

                sum +
                Number(
                    item.amount || 0
                ),

            0
        )

    /*
     |-------------------------------------------------------------
     | KATEGORI
     |-------------------------------------------------------------
     */

    const categoryMap: Record<string, number> = {}

    rows.forEach(item => {

        const category =
            item.category || '-'

        if (!categoryMap[category]) {

            categoryMap[category] = 0
        }

        categoryMap[category] +=
            Number(
                item.amount || 0
            )
    })

    const topCategory =
        Object.entries(
            categoryMap
        )

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0]

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return (

        <div
            className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-4
      "
        >

            <Card
                title={t('analytics.totalExpense')}
                value={
                    formatRupiah(
                        totalExpense
                    )
                }
            />

            <Card
                title={t('analytics.totalTransactions')}
                value={
                    rows.length
                }
            />

            <Card

                title={t('analytics.topCategory')}

                value={
                    topCategory
                        ? topCategory[0]
                        : '-'
                }

                subtitle={
                    topCategory
                        ? formatRupiah(
                            topCategory[1]
                        )
                        : null
                }

            />

        </div>
    )
}

function Card({

                  title,
                  value,
                  subtitle

              }: { title: string; value: string | number; subtitle?: string | null }) {

    return (

        <div
            className="
        bg-white
        border
        rounded-2xl
        p-5
      "
        >

            <p
                className="
          text-sm
          text-slate-500
        "
            >
                {title}
            </p>

            <h3
                className="
          text-2xl
          font-bold
          mt-2
        "
            >
                {value}
            </h3>

            {

                subtitle && (

                    <p
                        className="
              text-sm
              text-slate-400
              mt-2
            "
                    >
                        {subtitle}
                    </p>

                )
            }

        </div>
    )
}