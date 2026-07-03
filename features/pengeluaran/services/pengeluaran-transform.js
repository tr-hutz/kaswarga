export function transformPengeluaran(
    rows = []
) {

    return rows.map(item => {

        return {

            id:
            item.id,

            nomorBukti:
            item.nomor_bukti,

            kategori:
            item.kategori,

            deskripsi:
            item.deskripsi,

            nominal:
                Number(
                    item.nominal || 0
                ),

            penerima:
            item.penerima,

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

            status:
            item.status || 'pending',

            createdBy:
            item.created_by,

            approvedBy:
            item.approved_by,

            approvedAt:
            item.approved_at,

            catatanPenolakan:
            item.catatan_penolakan,

            aktif:
            item.aktif

        }

    })
}