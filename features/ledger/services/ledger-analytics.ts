// @ts-nocheck
export function buildLedgerAnalytics(

    rows = []

) {

    const income =
        rows

            .filter(
                item =>
                    item.type ===
                    'pemasukan'
            )

            .reduce(
                (sum, item) =>

                    sum +
                    item.amount,

                0
            )

    const expense =
        rows

            .filter(
                item =>
                    item.type ===
                    'pengeluaran'
            )

            .reduce(
                (sum, item) =>

                    sum +
                    item.amount,

                0
            )

    return {

        income,

        expense,

        balance:
            income -
            expense

    }
}
