/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

function buildRows(data: any[] = []) {
    return data.map(item => ({
        Nama:          item.name,
        Blok:          item.block,
        Rumah:         item.houseNumber,
        'No HP':       item.phoneNumber,
        Status:        item.paymentStatus,
        'Total Bayar': item.paidCount,
        Tunggakan:     item.arrears,
        Aktif:         item.active ? 'Aktif' : 'Nonaktif',
    }))
}

export async function exportResidentsToExcel(data: any[] = [], password?: string, fileName = 'residents.xlsx') {
    const rows = buildRows(data)

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Residents')

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
