import {

    formatRupiah

} from '../../../lib/utils'

export function transformLedger(

    rows = []

) {

    return rows.map(item => ({

        id:
        item.id,

        date:
        item.tanggal,

        type:
        item.jenis,

        source:
        item.sumber,

        description:
            item.deskripsi || '-',

        amount:
            item.nominal || 0,

        amountLabel:
            formatRupiah(
                item.nominal || 0
            ),

        balance:
            item.saldo_setelah || 0,

        balanceLabel:
            formatRupiah(
                item.saldo_setelah || 0
            )

    }))
}