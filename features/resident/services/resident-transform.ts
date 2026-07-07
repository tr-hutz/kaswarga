// @ts-nocheck
import { getResidentStatus } from './warga-status'
import {
    transformPaymentHistory
} from './warga-history-transform'

export function transformResident(

    rows: any[] = []

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
                item.payments || []
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
                item.name || '-',

            block:
                item.block || '-',

            houseNumber:
                item.house_number || '-',

            phone:
                item.phone || null,

            rtId:
            item.rt_id,

            active:
            item.active,

            createdAt:
            item.created_at,

            status,

            paymentHistory
        }
    })
}
