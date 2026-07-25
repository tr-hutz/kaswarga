/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

export async function exportExpenseToExcel(
    data: any[] = []
) {

    const rows =
        data.map(item => ({

            'Receipt Number':
            item.receiptNumber || '',

            Date:
            item.dateLabel,

            Category:
            item.category,

            'Partner / Recipient':
            item.recipient || '',

            Description:
            item.description,

            Amount:
            item.amount,

            Status:
            item.status || 'pending'

        }))

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Expenses')

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
    link.href     = url
    link.download = 'expenses.xlsx'
    link.click()
    URL.revokeObjectURL(url)
}

export async function exportExpenseToCSV(
    data: any[] = []
) {

    const rows =
        data.map(item => ({

            receipt_number:
            item.receiptNumber || '',

            date:
            item.dateLabel,

            category:
            item.category,

            recipient:
            item.recipient || '',

            description:
            item.description,

            amount:
            item.amount,

            status:
            item.status || 'pending'

        }))

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

    const url =
        URL.createObjectURL(
            blob
        )

    const link =
        document.createElement(
            'a'
        )

    link.href = url

    link.download =
        'expenses.csv'

    link.click()
    URL.revokeObjectURL(url)
}
