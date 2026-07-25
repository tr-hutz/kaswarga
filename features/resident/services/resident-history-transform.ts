import { MONTHS } from '@/lib/constants/months'

export function transformPaymentHistory(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[] = []
) {

    return rows.flatMap(item => {

        const details =
            item.payment_details || []

        return details.map((detail: { month: number; amount?: number }) => {

            const monthEntry =
                MONTHS.find(
                    m => Number(m.id) === Number(detail.month)
                )

            return {

                paymentId:
                item.id,

                date:
                item.date,

                year:
                item.year,

                month:
                detail.month,

                monthLabel:
                    monthEntry?.name || '-',

                amount:
                    Number(detail.amount || 0)
            }
        })
    })
}
