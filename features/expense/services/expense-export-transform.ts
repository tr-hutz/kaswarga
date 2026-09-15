/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

export async function exportExpenseToExcel(data: any[] = [], password?: string, fileName = 'expenses.xlsx') {
    const rows = data.map(item => ({
        'Receipt Number':      item.receiptNumber || '',
        Date:                  item.dateLabel,
        Category:              item.category,
        'Partner / Recipient': item.recipient || '',
        Description:           item.description,
        Amount:                item.amount,
        Status:                item.status || 'pending',
    }))

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Expenses')

    if (rows.length > 0) {
        sheet.addRow(Object.keys(rows[0]))
        rows.forEach(row => sheet.addRow(Object.values(row).map(v => v ?? '')))
    }

    const protect = process.env.NODE_ENV === 'production' && !!password
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer  = await workbook.xlsx.writeBuffer(protect ? { password } as any : undefined)
    const blob    = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
}
