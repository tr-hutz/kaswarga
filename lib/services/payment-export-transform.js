import {
    MONTHS
} from '../../constants/months'

function getMonthLabel(
    bulan
) {

    const month =
        MONTHS.find(
            item =>
                Number(item.id) ===
                Number(bulan)
        )

    return (
        month?.name || bulan
    )
}

export function transformPembayaranExport(

    rows = []

) {

    return rows.map(row => {

        /*
         |-----------------------------------------------------
         | BULAN
         |-----------------------------------------------------
         */

        const bulan =
            (row.details || [])

                .map(item =>
                    getMonthLabel(
                        item.bulan
                    )
                )

                .join(', ')

        /*
         |-----------------------------------------------------
         | RETURN
         |-----------------------------------------------------
         */

        return {

            Nama:
            row.nama,

            Rumah:
                `Blok ${row.blok} / ${row.noRumah}`,

            Tahun:
            row.tahun,

            Bulan:
            bulan,

            Status:
            row.status,

            'Total Bayar':
            row.totalBayar,

            Tanggal:
                row.createdAt
                    ? new Date(
                        row.createdAt
                    ).toLocaleDateString(
                        'id-ID'
                    )
                    : '-'
        }
    })
}