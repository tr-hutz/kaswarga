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
                        item.payment_details || []

                    const monthly =
                        details
                            .filter(detail =>
                                Number(detail.month) === Number(month.id)
                            )
                            .reduce(
                                (acc, detail) => {

                                    return (
                                        acc +
                                        Number(detail.amount || 0)
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
