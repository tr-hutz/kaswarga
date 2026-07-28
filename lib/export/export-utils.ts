import ExcelJS from 'exceljs'

import {
    saveAs
} from 'file-saver'

/*
 |-------------------------------------------------------------
 | EXPORT EXCEL
 |-------------------------------------------------------------
 */

export async function exportToExcel({
    data = [],
    fileName = 'export.xlsx',
    sheetName = 'Sheet1'
}: {
    data?: Record<string, unknown>[]
    fileName?: string
    sheetName?: string
}) {

    const workbook = new ExcelJS.Workbook()
    const sheet    = workbook.addWorksheet(sheetName)

    if (data.length > 0) {
        sheet.addRow(Object.keys(data[0]))
        data.forEach(row =>
            sheet.addRow(Object.values(row).map(v => v ?? ''))
        )
    }

    const buffer = await workbook.xlsx.writeBuffer()

    const blob =
        new Blob(
            [buffer],
            {
                type:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
            }
        )

    saveAs(
        blob,
        fileName
    )
}

/*
 |-------------------------------------------------------------
 | EXPORT CSV
 |-------------------------------------------------------------
 */

export function exportToCSV({
    data = [],
    fileName = 'export.csv'
}: {
    data?: Record<string, unknown>[]
    fileName?: string
}) {

    if (!data.length) {
        return
    }

    /*
     |---------------------------------------------------------
     | HEADERS
     |---------------------------------------------------------
     */

    const headers =
        Object.keys(
            data[0]
        )

    /*
     |---------------------------------------------------------
     | ROWS
     |---------------------------------------------------------
     */

    const rows =
        data.map(row => {

            return headers.map(header => {

                const value =
                    row[header]

                return `"${value ?? ''}"`

            }).join(',')

        })

    /*
     |---------------------------------------------------------
     | CSV
     |---------------------------------------------------------
     */

    const csvContent = [

        headers.join(','),

        ...rows

    ].join('\n')

    /*
     |---------------------------------------------------------
     | DOWNLOAD
     |---------------------------------------------------------
     */

    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        )

    saveAs(
        blob,
        fileName
    )
}
