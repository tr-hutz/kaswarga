import * as XLSX
    from 'xlsx'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRows(
    data: any[] = []
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportResidentsToExcel(
    data: any[] = []
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportResidentsToCSV(
    data: any[] = []
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
