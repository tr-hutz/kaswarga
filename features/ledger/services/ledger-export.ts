/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

function buildRows(rows: any[] = []) {
    return rows.map(item => ({
        Date:        item.date,
        Type:        item.type,
        Source:      item.source,
        Description: item.description,
        Amount:      item.amount,
        Balance:     item.balance,
    }))
}

export async function exportLedgerToExcel(rows: any[] = [], password?: string, fileName = 'ledger.xlsx') {
    const data = buildRows(rows)

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Ledger')

    if (data.length > 0) {
        sheet.addRow(Object.keys(data[0]))
        data.forEach(row => sheet.addRow(Object.values(row).map(v => v ?? '')))
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
