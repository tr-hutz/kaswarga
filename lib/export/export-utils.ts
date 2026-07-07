import * as XLSX from 'xlsx'

import {
    saveAs
} from 'file-saver'

/*
 |-------------------------------------------------------------
 | EXPORT EXCEL
 |-------------------------------------------------------------
 */

export function exportToExcel({
    data = [],
    fileName = 'export.xlsx',
    sheetName = 'Sheet1'
}: {
    data?: Record<string, unknown>[]
    fileName?: string
    sheetName?: string
}) {

    /*
     |---------------------------------------------------------
     | WORKSHEET
     |---------------------------------------------------------
     */

    const worksheet =
        XLSX.utils.json_to_sheet(
            data
        )

    /*
     |---------------------------------------------------------
     | WORKBOOK
     |---------------------------------------------------------
     */

    const workbook =
        XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        sheetName

    )

    /*
     |---------------------------------------------------------
     | BUFFER
     |---------------------------------------------------------
     */

    const excelBuffer =
        XLSX.write(
            workbook,
            {
                bookType: 'xlsx',
                type: 'array'
            }
        )

    /*
     |---------------------------------------------------------
     | FILE
     |---------------------------------------------------------
     */

    const blob =
        new Blob(
            [excelBuffer],
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