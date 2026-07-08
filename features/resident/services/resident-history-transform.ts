// @ts-nocheck
import { MONTHS } from '../../../constants/months'

export function transformPaymentHistory(
    rows = []
) {

    return rows.flatMap(item => {

        const details =
            item.payment_details || []

        return details.map(detail => {

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
