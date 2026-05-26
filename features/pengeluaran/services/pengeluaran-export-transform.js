import * as XLSX
    from 'xlsx'

export async function exportPengeluaranExcel(
    data = []
) {

    const rows =
        data.map(item => ({

            Tanggal:
            item.tanggalLabel,

            Kategori:
            item.kategori,

            Deskripsi:
            item.deskripsi,

            Nominal:
            item.nominal

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

export async function exportPengeluaranCSV(
    data = []
) {

    const rows =
        data.map(item => ({

            tanggal:
            item.tanggalLabel,

            kategori:
            item.kategori,

            deskripsi:
            item.deskripsi,

            nominal:
            item.nominal

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