import { getResidentStatus } from './warga-status'
import {
    transformPaymentHistory
} from './warga-history-transform'

export function transformResident(

    rows = []

) {

    return rows.map(item => {

        /*
         |---------------------------------------------------------
         | STATUS
         |---------------------------------------------------------
         */

        const status =
            getResidentStatus(
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

            name:
                item.nama || '-',

            block:
                item.blok || '-',

            houseNumber:
                item.no_rumah || '-',

            phone:
                item.no_hp || null,

            rtId:
            item.rt_id,

            active:
            item.aktif,

            createdAt:
            item.created_at,

            status,

            paymentHistory
        }
    })
}
