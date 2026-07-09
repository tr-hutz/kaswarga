// @ts-nocheck
import * as XLSX
    from 'xlsx'

function buildRows(
    data = []
) {

    return data.map(item => ({

        Nama:
        item.name,

        Blok:
        item.block,

        Rumah:
        item.houseNumber,

        'No HP':
        item.phoneNumber,

        Status:
        item.paymentStatus,

        'Total Bayar':
        item.paidCount,

        Tunggakan:
        item.arrears,

        Aktif:
            item.active
                ? 'Aktif'
                : 'Nonaktif'

    }))
}

export async function exportResidentsToExcel(
    data = []
) {

    const rows =
        buildRows(data)

    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        )

    const workbook =
        XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Residents'
    )

    XLSX.writeFile(
        workbook,
        'residents.xlsx'
    )
}

export async function exportResidentsToCSV(
    data = []
) {

    const rows =
        buildRows(data)

    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        )

    const csv =
        XLSX.utils.sheet_to_csv(
            worksheet
        )

    const blob =
        new Blob(
            [csv],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        )

    const link =
        document.createElement('a')

    const url =
        URL.createObjectURL(
            blob
        )

    link.href = url

    link.download =
        'residents.csv'

    link.click()
}