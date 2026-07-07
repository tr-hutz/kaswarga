// @ts-nocheck
import { MONTHS } from '../../../constants/months'

export function transformPaymentHistory(
    rows = []
) {

    return rows.flatMap(item => {

        const details =
            item.detail_pembayaran || []

        return details.map(detail => {

            const monthEntry =
                MONTHS.find(
                    m => Number(m.id) === Number(detail.bulan)
                )

            return {

                paymentId:
                item.id,

                date:
                item.tanggal,

                year:
                item.tahun,

                month:
                detail.bulan,

                monthLabel:
                    monthEntry?.name || '-',

                amount:
                    Number(detail.nominal || 0)
            }
        })
    })
}
