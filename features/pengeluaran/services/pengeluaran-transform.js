export function transformPengeluaran(
    rows = []
) {

    return rows.map(item => {

        return {

            id:
            item.id,

            kategori:
            item.kategori,

            deskripsi:
            item.deskripsi,

            nominal:
                Number(
                    item.nominal || 0
                ),

            tanggal:
            item.tanggal,

            tanggalLabel:
                new Date(
                    item.tanggal
                ).toLocaleDateString(
                    'id-ID'
                ),

            notaUrl:
            item.nota_url,

            aktif:
            item.aktif

        }

    })
}