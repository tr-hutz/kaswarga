/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

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

export async function exportResidentsToExcel(
    data: any[] = []
) {

    const rows = buildRows(data)

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Residents')

    if (rows.length > 0) {
        sheet.addRow(Object.keys(rows[0]))
        rows.forEach(row => sheet.addRow(Object.values(row).map(v => v ?? '')))
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    link.download = 'residents.xlsx'
    link.click()
    URL.revokeObjectURL(url)
}

export async function exportResidentsToCSV(
    data: any[] = []
) {

    const rows = buildRows(data)

    if (!rows.length) return

    const headers = Object.keys(rows[0])
    const lines   = [
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => `"${(row as any)[h] ?? ''}"`).join(',')
        ),
    ]

    const blob =
        new Blob(
            [lines.join('\n')],
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
    URL.revokeObjectURL(url)
}
