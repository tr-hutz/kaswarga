/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX
    from 'xlsx'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportLedgerToCSV(

    rows: any[] = []

) {

    const data =
        rows.map(item => ({

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

    const worksheet =
        XLSX.utils.json_to_sheet(
            data
        )

    const csv =
        XLSX.utils.sheet_to_csv(
            worksheet
        )

    const blob =
        new Blob(

            [csv],

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportLedgerToExcel(

    rows: any[] = []

) {

    const data =
        rows.map(item => ({

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

    const worksheet =
        XLSX.utils.json_to_sheet(
            data
        )

    const workbook =
        XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(

        workbook,
        worksheet,
        'Ledger'

    )

    XLSX.writeFile(

        workbook,

        'ledger.xlsx'
    )
}
