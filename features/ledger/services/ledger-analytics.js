export function buildLedgerAnalytics(

    rows = []

) {

    const pemasukan =
        rows

            .filter(
                item =>
                    item.jenis ===
                    'pemasukan'
            )

            .reduce(
                (sum, item) =>

                    sum +
                    item.nominal,

                0
            )

    const pengeluaran =
        rows

            .filter(
                item =>
                    item.jenis ===
                    'pengeluaran'
            )

            .reduce(
                (sum, item) =>

                    sum +
                    item.nominal,

                0
            )

    return {

        pemasukan,

        pengeluaran,

        saldo:
            pemasukan -
            pengeluaran

    }
}