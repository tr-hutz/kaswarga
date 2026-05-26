import * as XLSX
    from 'xlsx'

function buildRows(
    data = []
) {

    return data.map(item => ({

        Nama:
        item.nama,

        Blok:
        item.blok,

        Rumah:
        item.noRumah,

        'No HP':
        item.noHp,

        Status:
        item.statusPembayaran,

        'Total Bayar':
        item.totalBayar,

        Tunggakan:
        item.tunggakan,

        Aktif:
            item.aktif
                ? 'Aktif'
                : 'Nonaktif'

    }))
}

export async function exportWargaToExcel(
    data = []
) {

    const rows =
        buildRows(data)

    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        )

    const workbook =
        XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Warga'
    )

    XLSX.writeFile(
        workbook,
        'data-warga.xlsx'
    )
}

export async function exportWargaToCSV(
    data = []
) {

    const rows =
        buildRows(data)

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

    const link =
        document.createElement('a')

    const url =
        URL.createObjectURL(
            blob
        )

    link.href = url

    link.download =
        'data-warga.csv'

    link.click()
}