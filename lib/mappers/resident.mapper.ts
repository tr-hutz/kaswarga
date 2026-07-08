// @ts-nocheck
import { getResidentStatus } from '../../features/resident/services/warga-status'
import { transformPaymentHistory } from '../../features/resident/services/warga-history-transform'

export function mapResident(rows: unknown[] = []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rows as any[]).map(item => {
        const status = getResidentStatus(item)
        const paymentHistory = transformPaymentHistory(item.payments || [])

        return {
            id:          item.id,
            name:        item.name || '-',
            block:       item.block || '-',
            houseNumber: item.house_number || '-',
            phone:       item.phone || null,
            rtId:        item.rt_id,
            active:      item.active,
            createdAt:   item.created_at,
            status,
            paymentHistory
        }
    })
}
