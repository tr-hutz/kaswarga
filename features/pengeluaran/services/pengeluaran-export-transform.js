import * as XLSX
    from 'xlsx'

export async function exportPengeluaranExcel(
    data = []
) {

    const rows =
        data.map(item => ({

            'Nomor Bukti':
            item.nomorBukti || '',

            Tanggal:
            item.tanggalLabel,

            Kategori:
            item.kategori,

            'Mitra / Penerima':
            item.penerima || '',

            Deskripsi:
            item.deskripsi,

            Nominal:
            item.nominal,

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

export async function exportPengeluaranCSV(
    data = []
) {

    const rows =
        data.map(item => ({

            nomor_bukti:
            item.nomorBukti || '',

            tanggal:
            item.tanggalLabel,

            kategori:
            item.kategori,

            penerima:
            item.penerima || '',

            deskripsi:
            item.deskripsi,

            nominal:
            item.nominal,

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