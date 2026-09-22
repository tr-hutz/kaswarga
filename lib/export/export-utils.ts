import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export function exportFileName(rtName: string, module: string, ext = 'xlsx'): string {
    const now  = new Date()
    const mm   = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = String(now.getFullYear())
    const safe = rtName.replace(/\s+/g, '')
    return `${safe}-${module}-${mm}${yyyy}.${ext}`
}

export async function exportToExcel({
    data = [],
    fileName = 'export.xlsx',
    sheetName = 'Sheet1',
    password,
}: {
    data?: Record<string, unknown>[]
    fileName?: string
    sheetName?: string
    password?: string
}) {
    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet(sheetName)

    if (data.length > 0) {
        sheet.addRow(Object.keys(data[0]))
        data.forEach(row =>
            sheet.addRow(Object.values(row).map(v => v ?? ''))
        )
    }

    const protect = process.env.NODE_ENV === 'production' && !!password
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer  = await workbook.xlsx.writeBuffer(protect ? { password } as any : undefined)

    const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }
    )

    saveAs(blob, fileName)
}
