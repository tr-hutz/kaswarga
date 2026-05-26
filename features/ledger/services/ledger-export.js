import * as XLSX
    from 'xlsx'

export async function exportLedgerToCSV(

    rows = []

) {

    const data =
        rows.map(item => ({

            Tanggal:
            item.tanggal,

            Jenis:
            item.jenis,

            Sumber:
            item.sumber,

            Deskripsi:
            item.deskripsi,

            Nominal:
            item.nominal,

            Saldo:
            item.saldo

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

export async function exportLedgerToExcel(

    rows = []

) {

    const data =
        rows.map(item => ({

            Tanggal:
            item.tanggal,

            Jenis:
            item.jenis,

            Sumber:
            item.sumber,

            Deskripsi:
            item.deskripsi,

            Nominal:
            item.nominal,

            Saldo:
            item.saldo

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