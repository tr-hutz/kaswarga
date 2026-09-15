/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

export async function exportIncomeToExcel(data: any[] = [], password?: string, fileName = 'income.xlsx') {
    const rows = data.map(item => ({
        'Nama Pemasukan': item.income_name      || '',
        'Kategori':       item.income_category  || '',
        'Sumber Dana':    item.source_type       || '',
        'Pemberi':        item.payerLabel        || '',
        'Nominal':        item.amount            ?? 0,
        'Tanggal Terima': item.received_at       || '',
        'Metode Bayar':   item.payment_method    || '',
        'No Referensi':   item.reference_number  || '',
        'Status':         item.status            || '',
        'Catatan':        item.notes             || '',
    }))

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet('Income')

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
