import {

    formatRupiah

} from '../../../lib/utils'

export function transformLedger(

    rows: any[] = []

) {

    return rows.map(item => ({

        id:
        item.id,

        date:
        item.date,

        type:
        item.type,

        source:
        item.source,

        description:
            item.description || '-',

        amount:
            item.amount || 0,

        amountLabel:
            formatRupiah(
                item.amount || 0
            ),

        balance:
            item.balance_after || 0,

        balanceLabel:
            formatRupiah(
                item.balance_after || 0
            )

    }))
}
