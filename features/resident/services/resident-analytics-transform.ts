import { MONTHS } from '@/lib/constants/months'

export function transformResidentAnalytics(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payments: any[] = []
) {

    return MONTHS.map(month => {

        const total =
            payments.reduce(
                (sum, item) => {

                    const details =
                        item.payment_details || []

                    const monthly =
                        details
                            .filter((detail: { month: number }) =>
                                Number(detail.month) === Number(month.id)
                            )
                            .reduce(
                                (acc: number, detail: { amount?: number }) => {

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
