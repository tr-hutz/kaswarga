import {
    MONTHS
} from '../../constants/months'

function getMonthLabel(
    monthId
) {

    const month =
        MONTHS.find(
            item =>
                Number(item.id) ===
                Number(monthId)
        )

    return (
        month?.name || monthId
    )
}

export function transformPaymentExport(

    rows = []

) {

    return rows.map(row => {

        /*
         |-----------------------------------------------------
         | BULAN
         |-----------------------------------------------------
         */

        const months =
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
            row.name || row.residentName || '-',

            Rumah:
                row.block && row.houseNumber
                    ? `Blok ${row.block} / ${row.houseNumber}`
                    : (row.address || '-'),

            Tahun:
            row.year,

            Bulan:
            months,

            Status:
            row.status,

            'Total Bayar':
            row.totalAmount,

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