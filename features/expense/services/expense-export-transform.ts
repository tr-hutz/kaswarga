// @ts-nocheck
import * as XLSX
    from 'xlsx'

export async function exportExpenseToExcel(
    data = []
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

    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        )

    const workbook =
        XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(

        workbook,
        worksheet,
        'Expenses'

    )

    XLSX.writeFile(
        workbook,
        'expenses.xlsx'
    )
}

export async function exportExpenseToCSV(
    data = []
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

    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
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
}