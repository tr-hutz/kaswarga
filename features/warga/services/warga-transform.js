import { getWargaStatus } from './warga-status'
import {
    transformPaymentHistory
} from './warga-history-transform'

export function transformWarga(

    rows = []

) {

    return rows.map(item => {

        /*
         |---------------------------------------------------------
         | STATUS
         |---------------------------------------------------------
         */

        const status =
            getWargaStatus(
                item
            )

        const paymentHistory =
            transformPaymentHistory(
                item.pembayaran || []
            )

        /*
         |---------------------------------------------------------
         | RETURN
         |---------------------------------------------------------
         */

        return {

            id:
            item.id,

            nama:
                item.nama || '-',

            blok:
                item.blok || '-',

            noRumah:
                item.no_rumah || '-',

            rtId:
            item.rt_id,

            aktif:
            item.aktif,

            createdAt:
            item.created_at,

            status,

            paymentHistory
        }
    })
}