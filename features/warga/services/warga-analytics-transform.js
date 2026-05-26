import { MONTHS } from '../../../constants/months'

export function transformWargaAnalytics(
    pembayaran = []
) {

    return MONTHS.map(month => {

        const total =
            pembayaran.reduce(
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