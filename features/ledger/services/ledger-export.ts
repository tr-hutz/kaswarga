/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

function buildRows(rows: any[] = []) {
    return rows.map(item => ({

        Date:
        item.date,

        Type:
        item.type,

        Source:
        item.source,

        Description:
        item.description,

        Amount:
        item.amount,

        Balance:
        item.balance

    }))
}

export async function exportLedgerToCSV(

    rows: any[] = []

) {

    const data = buildRows(rows)

    if (!data.length) return

    const headers = Object.keys(data[0])
    const lines   = [
        headers.join(','),
        ...data.map(row =>
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
        document.createElement(
            'a'
        )

    link.href =
        URL.createObjectURL(
            blob
        )

    link.download =
        'ledger.csv'

    link.click()
}

export async function exportLedgerToExcel(

    rows: any[] = []

) {

    const data = buildRows(rows)

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Ledger')

    if (data.length > 0) {
        sheet.addRow(Object.keys(data[0]))
        data.forEach(row => sheet.addRow(Object.values(row).map(v => v ?? '')))
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = 'ledger.xlsx'
    link.click()
    URL.revokeObjectURL(url)
}
