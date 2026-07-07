// @ts-nocheck
export function transformExpense(
    rows: any[] = []
) {

    return rows.map(item => {

        return {

            id:
            item.id,

            receiptNumber:
            item.nomor_bukti,

            category:
            item.kategori,

            description:
            item.deskripsi,

            amount:
                Number(
                    item.nominal || 0
                ),

            recipient:
            item.penerima,

            date:
            item.tanggal,

            dateLabel:
                new Date(
                    item.tanggal
                ).toLocaleDateString(
                    'id-ID'
                ),

            receiptUrl:
            item.nota_url,

            status:
            item.status || 'pending',

            createdBy:
            item.created_by,

            approvedBy:
            item.approved_by,

            approvedAt:
            item.approved_at,

            rejectionNote:
            item.catatan_penolakan,

            active:
            item.aktif

        }

    })
}