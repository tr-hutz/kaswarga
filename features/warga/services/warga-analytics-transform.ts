// @ts-nocheck
import { MONTHS } from '../../../constants/months'

export function transformResidentAnalytics(
    payments = []
) {

    return MONTHS.map(month => {

        const total =
            payments.reduce(
                (sum, item) => {

                    const details =
                        item.detail_pembayaran || []

                    const monthly =
                        details
                            .filter(detail =>
                                Number(detail.bulan) === Number(month.id)
                            )
                            .reduce(
                                (acc, detail) => {

                                    return (
                                        acc +
                                        Number(detail.nominal || 0)
                                    )
                                },
                                0
                            )

                    return sum + monthly

                },
                0
            )

        return {
            month: month.short,
            total
        }
    })
}