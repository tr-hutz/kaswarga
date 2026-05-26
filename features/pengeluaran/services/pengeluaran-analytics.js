export function buildPengeluaranAnalytics(

    rows = []

) {

    /*
     |-------------------------------------------------------------
     | TOTAL
     |-------------------------------------------------------------
     */

    const totalNominal =
        rows.reduce(

            (
                sum,
                item
            ) =>

                sum +
                Number(
                    item.nominal || 0
                ),

            0
        )

    /*
     |-------------------------------------------------------------
     | CATEGORY MAP
     |-------------------------------------------------------------
     */

    const kategoriMap = {}

    rows.forEach(item => {

        const kategori =
            item.kategori || '-'

        if (!kategoriMap[kategori]) {

            kategoriMap[kategori] = 0
        }

        kategoriMap[kategori] +=
            Number(
                item.nominal || 0
            )
    })

    /*
     |-------------------------------------------------------------
     | TOP CATEGORY
     |-------------------------------------------------------------
     */

    const topKategori =
        Object.entries(
            kategoriMap
        )

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0]

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return {

        totalNominal,

        totalTransaksi:
        rows.length,

        kategoriMap,

        topKategori
    }
}