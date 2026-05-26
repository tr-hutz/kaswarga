import { MONTHS } from '../../../constants/months'

export function transformPaymentHistory(
    rows = []
) {

    return rows.flatMap(item => {

        const details =
            item.detail_pembayaran || []

        return details.map(detail => {

            const month =
                MONTHS.find(
                    m => Number(m.id) === Number(detail.bulan)
                )

            return {

                pembayaranId:
                item.id,

                tanggal:
                item.tanggal,

                tahun:
                item.tahun,

                bulan:
                detail.bulan,

                bulanLabel:
                    month?.name || '-',

                nominal:
                    Number(detail.nominal || 0)
            }
        })
    })
}