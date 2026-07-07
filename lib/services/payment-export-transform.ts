import {
    MONTHS
} from '../../constants/months'

interface PaymentExportRow {
    name?: string
    residentName?: string
    block?: string
    houseNumber?: string
    address?: string
    year?: number
    status?: string
    totalAmount?: number
    createdAt?: string
    details?: { bulan: number | string }[]
}

function getMonthLabel(monthId: number | string): string {

    const month =
        MONTHS.find(
            item =>
                Number(item.id) ===
                Number(monthId)
        )

    return month?.name || String(monthId)
}

export function transformPaymentExport(rows: PaymentExportRow[] = []) {

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