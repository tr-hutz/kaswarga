// @ts-nocheck
import * as XLSX
    from 'xlsx'

export async function exportExpenseToExcel(
    data = []
) {

    const rows =
        data.map(item => ({

            'Nomor Bukti':
            item.receiptNumber || '',

            Tanggal:
            item.dateLabel,

            Kategori:
            item.category,

            'Mitra / Penerima':
            item.recipient || '',

            Deskripsi:
            item.description,

            Nominal:
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
        'Pengeluaran'

    )

    XLSX.writeFile(
        workbook,
        'pengeluaran.xlsx'
    )
}

export async function exportExpenseToCSV(
    data = []
) {

    const rows =
        data.map(item => ({

            nomor_bukti:
            item.receiptNumber || '',

            tanggal:
            item.dateLabel,

            kategori:
            item.category,

            penerima:
            item.recipient || '',

            deskripsi:
            item.description,

            nominal:
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
        'pengeluaran.csv'

    link.click()
}