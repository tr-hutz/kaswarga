/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'

export async function exportIncomeToExcel(data: any[] = []) {
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

    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = 'income.xlsx'
    link.click()
    URL.revokeObjectURL(url)
}

export async function exportIncomeToCSV(data: any[] = []) {
    const rows = data.map(item => ({
        income_name:      item.income_name      || '',
        income_category:  item.income_category  || '',
        source_type:      item.source_type       || '',
        payer:            item.payerLabel        || '',
        amount:           item.amount            ?? 0,
        received_at:      item.received_at       || '',
        payment_method:   item.payment_method    || '',
        reference_number: item.reference_number  || '',
        status:           item.status            || '',
        notes:            item.notes             || '',
    }))

    if (!rows.length) return

    const headers = Object.keys(rows[0])
    const lines   = [
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => `"${(row as any)[h] ?? ''}"`).join(',')
        ),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = 'income.csv'
    link.click()
    URL.revokeObjectURL(url)
}
