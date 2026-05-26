import {

    formatRupiah

} from '../../../lib/utils'

export function transformLedger(

    rows = []

) {

    return rows.map(item => ({

        id:
        item.id,

        tanggal:
        item.tanggal,

        jenis:
        item.jenis,

        sumber:
        item.sumber,

        deskripsi:
            item.deskripsi || '-',

        nominal:
            item.nominal || 0,

        nominalLabel:
            formatRupiah(
                item.nominal || 0
            ),

        saldo:
            item.saldo_setelah || 0,

        saldoLabel:
            formatRupiah(
                item.saldo_setelah || 0
            )

    }))
}